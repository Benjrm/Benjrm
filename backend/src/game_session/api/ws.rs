use {
    crate::{
        AppData,
        auth::User,
        error::{Error, ErrorResponse},
        game_session::{
            Channel, ChannelError, Command, CommandTrait, GameSession, GameSessionError,
            GameSessionStatus, HostMessage, Joining, Message, PlayerCommand, PlayerMessage,
            SessionCode,
        },
    },
    actix_web::{HttpRequest, HttpResponse, rt, web},
    actix_ws::{CloseCode, Closed, MessageStream},
    chrono::{DateTime, TimeDelta, Utc},
    futures::StreamExt,
    serde::Serialize,
    std::{
        fmt,
        sync::{
            Arc,
            atomic::{AtomicI64, Ordering},
        },
        time::Duration,
    },
    tokio::{
        sync::Mutex,
        task::JoinHandle,
        time::{Instant, sleep},
    },
    uuid::Uuid,
};

async fn get_host_ws(
    req: HttpRequest,
    body: web::Payload,
    user: User,
    code: web::Path<SessionCode>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse, actix_web::Error> {
    let code = code.into_inner();
    let session = app_data
        .game_sessions
        .get_session(code)
        .await
        .map_err(Error::from)?;
    let (res, tx, rx) = actix_ws::handle(&req, body)?;

    let session_arc = Arc::clone(&session);
    let mut session = session.lock().await;

    session.check_set_host_channel(&user).map_err(Error::from)?;
    let channel_builder = WsChannelBuilder::new(tx, rx, app_data, session_arc);
    let channel = channel_builder.build(code, GameSession::handle_host_cmd, remove_host_ws);

    session.set_host_channel(channel).await;

    Ok(res)
}

async fn remove_host_ws(
    app_data: web::Data<AppData>,
    session: Arc<Mutex<GameSession>>,
    id: u64,
    code: SessionCode,
) {
    sleep(Duration::from_mins(15)).await;
    let mut session = session.lock().await;

    if let Some(channel) = &session.host.channel
        && channel.id() == id
    {
        log::info!("Deleting session {code} due to inactivity");
        app_data.game_sessions.drop_session(code).await;
        session.host.channel = None;
        session.close().await;
    }
}

async fn get_player_ws(
    req: HttpRequest,
    body: web::Payload,
    code: web::Path<SessionCode>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse, actix_web::Error> {
    let code = code.into_inner();
    let session = app_data
        .game_sessions
        .get_session(code)
        .await
        .map_err(Error::from)?;

    match &mut session.lock().await.status {
        GameSessionStatus::Waiting(joining) => {
            let (res, tx, rx) = actix_ws::handle(&req, body)?;

            let channel_builder =
                WsChannelBuilder::new(tx.clone(), rx, app_data, Arc::clone(&session));
            let id = channel_builder.id;
            let handle = rt::spawn(channel_builder.wait_for_join());

            joining.push(Box::new(WsJoining { id, handle, tx }));
            Ok(res)
        }
        _ => Err(Error::from(GameSessionError::AlreadyStarted).into()),
    }
}

struct WsJoining {
    id: u64,
    handle: JoinHandle<()>,
    tx: actix_ws::Session,
}

#[async_trait::async_trait]
impl Joining for WsJoining {
    async fn cancel(mut self: Box<Self>) {
        self.handle.abort();
        if let Ok(msg) = serde_json::to_string(&PlayerMessage::Kick) {
            let _ = self.tx.text(msg).await;
        }
        let _ = self.tx.close(Some(CloseCode::Normal.into())).await;
    }
    fn id(&self) -> u64 {
        self.id
    }
}

impl fmt::Debug for WsJoining {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("JoiningPlayer")
            .field("id", &self.id)
            .finish()
    }
}

struct InnerChannel {
    tx: actix_ws::Session,
    rx: MessageStream,
    timeouts: u32,
    ping_id: u32,
    ping_send: DateTime<Utc>,
    time_delta_ms: Arc<AtomicI64>,
    ring_delta: RingDelta,
}

impl InnerChannel {
    pub fn new(tx: actix_ws::Session, rx: MessageStream) -> Self {
        Self {
            tx,
            rx,
            timeouts: 0,
            ping_id: 0,
            ping_send: Utc::now(),
            time_delta_ms: Arc::new(AtomicI64::new(0)),
            ring_delta: RingDelta::new(),
        }
    }

    async fn recv_msg(&mut self) -> Result<Option<actix_ws::Message>, Closed> {
        tokio::select! {
            _ = sleep(Duration::from_secs(4)) => {
                if self.timeouts < 4 {
                    self.timeouts += 1;
                    Ok(None)
                } else {
                    Err(Closed)
                }
            },
            msg = self.rx.next() => match msg {
                Some(Ok(msg)) => {
                    self.timeouts = 0;
                    Ok(Some(msg))
                }
                _ => Err(Closed),
            }
        }
    }

    async fn recv<Cmd: CommandTrait>(&mut self) -> Result<Option<Cmd>, Closed> {
        let msg = self.recv_msg().await?;
        let now = Utc::now();

        let cmd = if let Some(msg) = msg {
            let cmd = match msg {
                actix_ws::Message::Text(byte_string) => {
                    Some(Cmd::parse_json(byte_string.as_bytes()))
                }
                actix_ws::Message::Binary(bytes) => Some(Cmd::parse_json(&bytes)),
                actix_ws::Message::Ping(bytes) => {
                    self.tx.pong(&bytes).await?;
                    None
                }
                actix_ws::Message::Close(_) => return Err(Closed),
                _ => None,
            };

            match cmd {
                Some(Ok(cmd)) => {
                    if let Some((pong_id, timestamp)) = cmd.pong() {
                        if pong_id == self.ping_id {
                            let delay = (now - self.ping_send) / 2;
                            let dest_time = timestamp + delay;
                            let time_delta = now - dest_time;
                            self.ring_delta.insert(time_delta);
                            self.time_delta_ms
                                .store(self.ring_delta.avg().num_milliseconds(), Ordering::Relaxed);
                        }
                        None
                    } else {
                        Some(cmd)
                    }
                }
                Some(Err(err)) => {
                    log::error!("error parsing websocket command: {err:?}");
                    None
                }
                None => None,
            }
        } else {
            None
        };

        if now >= self.ping_send + Duration::from_secs(4) {
            self.ping_id += 1;
            self.ping_send = Utc::now();
            let ping_message = serde_json::to_string(&PingCommand {
                command: "ping",
                payload: Ping { id: self.ping_id },
            });
            if let Ok(ping_message) = ping_message {
                self.tx.text(ping_message).await?;
            }
        }

        Ok(cmd)
    }

    async fn msg(&mut self, id: Option<u64>, msg: &PlayerMessage) {
        let msg = Message {
            id,
            msg,
            timing: None,
        };
        if let Ok(message_string) = serde_json::to_string(&msg) {
            let _ = self.tx.text(message_string).await;
        }
    }

    async fn ok(&mut self, id: Option<u64>) {
        self.msg(id, &PlayerMessage::Ok).await;
    }

    async fn error(&mut self, id: Option<u64>, err: Error) {
        self.msg(id, &PlayerMessage::Error(err.into())).await;
    }
}

pub struct WsChannelBuilder {
    id: u64,
    inner: InnerChannel,
    app_data: web::Data<AppData>,
    session: Arc<Mutex<GameSession>>,
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
                        #[derive(Serialize)]
                        #[serde(tag = "command", content = "payload", rename_all = "camelCase")]
                        enum Response {
                            Ok,
                            Error(ErrorResponse),
                        }
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

async fn remove_player_ws(
    _app_data: web::Data<AppData>,
    session: Arc<Mutex<GameSession>>,
    _channel_id: u64,
    player_id: Uuid,
) {
    let mut session = session.lock().await;

    if let Some(player_pos) = session.players.iter().position(|x| x.id == player_id) {
        session.players.swap_remove(player_pos);
        session
            .host
            .msg(Message::from(&HostMessage::RemovePlayer { id: player_id }))
            .await
    }
}

pub struct WsChannel {
    id: u64,
    tx: actix_ws::Session,
    time_delta_ms: Arc<AtomicI64>,
    handle: JoinHandle<()>,
}

struct RingDelta {
    pos: usize,
    deltas: [TimeDelta; Self::COUNT],
}

impl RingDelta {
    const COUNT: usize = 5;
    fn new() -> Self {
        Self {
            pos: 0,
            deltas: [TimeDelta::zero(); Self::COUNT],
        }
    }

    fn insert(&mut self, new: TimeDelta) {
        self.deltas[self.pos] = new;
        self.pos = (self.pos + 1) % Self::COUNT;
    }

    fn avg(&self) -> TimeDelta {
        let mut total_delta = TimeDelta::zero();
        for delta in self.deltas {
            total_delta += delta;
        }

        total_delta / Self::COUNT as i32
    }
}

#[derive(Serialize)]
struct Ping {
    id: u32,
}

#[derive(Serialize)]
struct PingCommand {
    command: &'static str,
    payload: Ping,
}

async fn send_msg_log_error<T: Serialize>(tx: &mut actix_ws::Session, msg: Message<'_, T>) {
    if let Err(err) = send_msg(tx, msg).await {
        log::error!("failed to send message: {err:?}")
    }
}

async fn send_msg<T: Serialize>(
    tx: &mut actix_ws::Session,
    msg: Message<'_, T>,
) -> Result<(), WsChannelError> {
    let message_string = serde_json::to_string(&msg).map_err(WsChannelError::Serialization)?;
    tx.text(message_string).await.map_err(WsChannelError::Tx)?;
    Ok(())
}

#[async_trait::async_trait]
impl<T: Serialize + Sync + 'static> Channel<T> for WsChannel {
    async fn send(&mut self, mut msg: Message<'_, T>) -> Result<(), ChannelError> {
        if let Some(timing) = &mut msg.timing {
            let ms = self.time_delta_ms.load(Ordering::Relaxed);
            *timing += TimeDelta::milliseconds(ms);
        }

        send_msg(&mut self.tx, msg).await.map_err(Into::into)
    }

    async fn close(self: Box<Self>) {
        let _ = self.tx.close(Some(CloseCode::Normal.into())).await;
        self.handle.abort();
    }

    fn id(&self) -> u64 {
        self.id
    }
}

#[derive(Debug)]
pub enum WsChannelError {
    Serialization(serde_json::Error),
    Tx(actix_ws::Closed),
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::resource("/sessions/{code}/ws/host").route(web::get().to(get_host_ws)));
    cfg.service(web::resource("/sessions/{code}/ws/player").route(web::get().to(get_player_ws)));
}
