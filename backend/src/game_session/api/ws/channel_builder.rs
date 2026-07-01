use {
    crate::{
        AppData,
        error::Error,
        game_session::{
            Channel, Command, CommandTrait, GameSession, GameSessionError, GameSessionStatus,
            Message, PlayerCommand,
            api::ws::{
                Response,
                channel::{WsChannel, send_msg_log_error},
                handler::remove_player_ws,
                inner_channel::InnerChannel,
            },
        },
    },
    actix_web::{rt, web},
    actix_ws::MessageStream,
    std::{sync::Arc, time::Duration},
    tokio::{sync::Mutex, time::Instant},
    uuid::Uuid,
};

/// Builder for creating a new [`WsChannel`]. This struct is used to configure the channel before it is built.
///
/// A [`WsChannelBuilder`] owns the underlying WebSocket connection until it is converted into a [`WsChannel`] with [`Self::build`].
pub struct WsChannelBuilder {
    pub(super) id: u64,
    pub(super) inner: InnerChannel,
    pub(super) app_data: web::Data<AppData>,
    pub(super) session: Arc<Mutex<GameSession>>,
}

impl WsChannelBuilder {
    /// Creates a new [`WsChannelBuilder`] for a [`WsChannel`] connection.
    ///
    /// **Hint:** The returned builder does not start processing incoming messages.
    /// Call [`Self::build`] to spawn the processing task.
    pub fn new(
        tx: actix_ws::Session,
        rx: MessageStream,
        app_data: web::Data<AppData>,
        session: Arc<Mutex<GameSession>>,
    ) -> Self {
        let id = <WsChannel as Channel<()>>::generate_id();
        Self {
            id,
            inner: InnerChannel::new(tx, rx),
            app_data,
            session,
        }
    }

    /// Create a new [`WsChannel`] and spawn a new listener. To terminate the listener, call [`WsChannel::close`].
    ///
    /// This method consumes the builder and spawns a background task that continuously receives commands from the WebSocket connection.
    pub fn build<
        Cmd: CommandTrait + 'static,
        Payload: Copy + 'static,
        HandleCmd: AsyncFn(
                &mut GameSession,
                Cmd,
                Arc<Mutex<GameSession>>,
                Payload,
            ) -> Result<(), GameSessionError>
            + Send
            + 'static,
        HandleDelete: AsyncFn(web::Data<AppData>, Arc<Mutex<GameSession>>, u64, Payload) + Send + 'static,
    >(
        mut self,
        payload: Payload,
        handle_cmd: HandleCmd,
        handle_delete: HandleDelete,
    ) -> WsChannel {
        let time_delta_ms = Arc::clone(&self.inner.time_delta_ms);
        let tx = self.inner.tx.clone();

        let handle = rt::spawn(async move {
            while let Ok(cmd) = self.inner.recv::<Cmd>().await {
                if let Some(cmd) = cmd {
                    let cmd_id = cmd.id();
                    let res = handle_cmd(
                        &mut *self.session.lock().await,
                        cmd,
                        Arc::clone(&self.session),
                        payload,
                    )
                    .await;

                    if cmd_id.is_some() {
                        match res {
                            Ok(()) => {
                                send_msg_log_error(
                                    &mut self.inner.tx,
                                    Message {
                                        id: cmd_id,
                                        msg: &Response::Ok,
                                        timing: None,
                                    },
                                )
                                .await;
                            }
                            Err(err) => {
                                send_msg_log_error(
                                    &mut self.inner.tx,
                                    Message {
                                        id: cmd_id,
                                        msg: &Response::Error(Error::from(err).into()),
                                        timing: None,
                                    },
                                )
                                .await;
                            }
                        }
                    }
                }
            }
            handle_delete(self.app_data, self.session, self.id, payload).await;
        });

        WsChannel {
            id: self.id,
            tx,
            time_delta_ms,
            handle,
        }
    }

    /// Waits for a player to join or reconnect to the game.
    ///
    /// Only [`PlayerCommand::SetName`] and [`PlayerCommand::Reconnect`] commands are processed.
    /// All other incoming messages are ignored.
    pub async fn wait_for_join(self) {
        let start = Instant::now();
        let session = Arc::clone(&self.session);

        // Put self inside an option to allow calling `handle_join_cmd` (which might move self) multiple times (until the move of self is successful)
        let mut self_optional = Some(self);
        while let Some(_self) = &mut self_optional
            && let Ok(cmd) = _self.inner.recv::<Command<PlayerCommand>>().await
        {
            if let Some(cmd) = cmd {
                let cmd_id = cmd.id;
                let res = Self::handle_join_cmd(&mut self_optional, &session, cmd).await;
                match &mut self_optional {
                    Some(_self) => {
                        if let Err(err) = res {
                            _self.inner.error(cmd_id, err.into()).await;
                        }
                    }
                    // If self_optional is None this means that self has been moved by successfully creating a channel
                    None => return,
                }
            }
            if start.elapsed() > Duration::from_mins(15) {
                return;
            }
        }
    }

    /// Handle [`PlayerCommand::SetName`] or [`PlayerCommand::Reconnect`].
    ///
    /// On success, `self_optional` is set to `None` and `Ok()` is returned.
    /// If some error occures, `self_optional` remains unchanged and `Err()` is returned.
    /// If `cmd` is some other command, `self_optional` remains unchanged and `Ok()` is returned.
    async fn handle_join_cmd(
        self_optional: &mut Option<Self>,
        session: &Mutex<GameSession>,
        cmd: Command<PlayerCommand>,
    ) -> Result<(), GameSessionError> {
        match cmd.command {
            PlayerCommand::SetName { name, emoji } => {
                let id = Uuid::new_v4();
                let emoji = match emoji {
                    Some(emoji) => Some(emojis::get(&emoji).ok_or(GameSessionError::InvalidEmoji)?),
                    None => None,
                };
                let mut session = session.lock().await;
                session.check_add_player(&name)?;

                // Take `_self` out of `self_optional` to let `session.add_player` consume it
                if let Some(mut _self) = self_optional.take() {
                    _self.inner.ok(cmd.id).await;
                    let channel = _self.build(id, GameSession::handle_player_cmd, remove_player_ws);
                    session.add_player(cmd.id, id, channel, name, emoji).await;
                }
            }
            PlayerCommand::Reconnect { id, secret } => {
                let mut session = session.lock().await;
                let player = GameSession::get_player_mut(&mut session.players, id)?;
                player.check_set_channel(secret)?;

                // Take `_self` out of `self_optional` to let `player.set_channel` consume it
                if let Some(mut _self) = self_optional.take() {
                    let channel_builder_id = _self.id;
                    _self.inner.ok(cmd.id).await;
                    let channel = _self.build(id, GameSession::handle_player_cmd, remove_player_ws);
                    player.set_channel(cmd.id, channel).await;
                    let player_id = player.id;
                    // Remove from joining so game start doesn't cancel (kick) this reconnected connection.
                    if let GameSessionStatus::Waiting(joining) = &mut session.status
                        && let Some(pos) = joining.iter().position(|x| x.id() == channel_builder_id)
                    {
                        joining.swap_remove(pos);
                    }
                    session.update_player(player_id).await;
                }
            }
            _ => (),
        }
        Ok(())
    }
}
