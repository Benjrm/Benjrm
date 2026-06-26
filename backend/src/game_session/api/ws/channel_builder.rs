use {
    crate::{
        AppData,
        error::Error,
        game_session::{
            Channel, Command, CommandTrait, GameSession, GameSessionError, Message, PlayerCommand,
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

pub struct WsChannelBuilder {
    pub(super) id: u64,
    pub(super) inner: InnerChannel,
    pub(super) app_data: web::Data<AppData>,
    pub(super) session: Arc<Mutex<GameSession>>,
}

impl WsChannelBuilder {
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

    /// Wait for [`PlayerCommand::SetName`] and add player to [`GameSession`] on success.
    /// Timeouts after 15 minutes and ignores all other messages.
    pub async fn wait_for_join(mut self) {
        let start = Instant::now();
        while let Ok(cmd) = self.inner.recv::<Command<PlayerCommand>>().await {
            if let Some(cmd) = cmd
                && let PlayerCommand::SetName { name, emoji } = cmd.command
            {
                let id = Uuid::new_v4();
                let emoji = match emoji {
                    Some(emoji) => match emojis::get(&emoji) {
                        Some(emoji) => Some(emoji),
                        None => {
                            self.inner
                                .error(cmd.id, GameSessionError::InvalidEmoji.into())
                                .await;
                            continue;
                        }
                    },
                    None => None,
                };
                let session = Arc::clone(&self.session);
                let mut session = session.lock().await;
                if let Err(err) = session.check_add_player(&name) {
                    self.inner.error(cmd.id, err.into()).await;
                    continue;
                }
                self.inner.ok(cmd.id).await;
                let channel = self.build(id, GameSession::handle_player_cmd, remove_player_ws);
                session.add_player(id, channel, name, emoji).await;
                return;
            }
            if start.elapsed() > Duration::from_mins(15) {
                return;
            }
        }
    }
}
