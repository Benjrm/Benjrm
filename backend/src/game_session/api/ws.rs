use {
    crate::{
        AppData,
        auth::User,
        error::Error,
        game_session::{
            Channel, ChannelError, Command, CommandTrait, GameSession, HostCommand, HostMessage,
            Message, PlayerCommand, SessionCode,
        },
    },
    actix_web::{HttpRequest, HttpResponse, rt, web},
    actix_ws::{CloseCode, Closed, MessageStream},
    chrono::{TimeDelta, Utc},
    futures::StreamExt,
    serde::Serialize,
    std::{
        sync::{
            Arc,
            atomic::{AtomicI64, Ordering},
        },
        time::Duration,
    },
    tokio::{sync::Mutex, task::JoinHandle, time::sleep},
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
    let channel = WsChannel::new::<Command<HostCommand>, _, _, _>(
        rx,
        tx,
        app_data,
        session_arc,
        code,
        GameSession::handle_host_cmd,
        remove_host_ws,
    );
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
    let (res, tx, rx) = actix_ws::handle(&req, body)?;

    let session_arc = Arc::clone(&session);
    let mut session = session.lock().await;

    let id = Uuid::new_v4();
    let channel = WsChannel::new::<Command<PlayerCommand>, _, _, _>(
        rx,
        tx,
        app_data,
        session_arc,
        id,
        GameSession::handle_player_cmd,
        remove_player_ws,
    );

    session
        .set_player_channel(id, channel)
        .await
        .map_err(Error::from)?;

    Ok(res)
}

async fn remove_player_ws(
    _app_data: web::Data<AppData>,
    session: Arc<Mutex<GameSession>>,
    _channel_id: u64,
    player_id: Uuid,
) {
    let mut session = session.lock().await;

    if let Some(player_pos) = session.players.iter().position(|x| x.id == player_id) {
        let player = session.players.swap_remove(player_pos);
        if player.name.is_some() {
            session
                .host
                .msg(Message::from(&HostMessage::RemovePlayer { id: player_id }))
                .await
        }
    }
}

pub struct WsChannel {
    id: u64,
    tx: actix_ws::Session,
    time_delta_ms: Arc<AtomicI64>,
    handle: JoinHandle<()>,
}

impl WsChannel {
    pub fn new<
        Cmd: CommandTrait + 'static,
        Payload: Copy + 'static,
        HandleCmd: AsyncFn(&mut GameSession, Cmd, Payload) + Send + 'static,
        HandleDelete: AsyncFn(web::Data<AppData>, Arc<Mutex<GameSession>>, u64, Payload) + Send + 'static,
    >(
        rx: MessageStream,
        tx: actix_ws::Session,
        app_data: web::Data<AppData>,
        session: Arc<Mutex<GameSession>>,
        payload: Payload,
        handle_cmd: HandleCmd,
        handle_delete: HandleDelete,
    ) -> Self {
        let id = <Self as Channel<()>>::generate_id();
        let time_delta_ms = Arc::new(AtomicI64::new(0));
        let handle = rt::spawn(ws_listener::<Cmd, _, _, _>(
            rx,
            tx.clone(),
            app_data,
            session,
            payload,
            handle_cmd,
            handle_delete,
            id,
            time_delta_ms.clone(),
        ));
        Self {
            id,
            tx,
            time_delta_ms,
            handle,
        }
    }
}

#[allow(clippy::too_many_arguments)] // Only relevant for readability
async fn ws_listener<
    Cmd: CommandTrait,
    Payload: Copy,
    HandleCmd: AsyncFn(&mut GameSession, Cmd, Payload) + Send,
    HandleDelete: AsyncFn(web::Data<AppData>, Arc<Mutex<GameSession>>, u64, Payload) + Send,
>(
    mut rx: MessageStream,
    mut tx: actix_ws::Session,
    app_data: web::Data<AppData>,
    session: Arc<Mutex<GameSession>>,
    payload: Payload,
    handle_cmd: HandleCmd,
    handle_delete: HandleDelete,
    socket_id: u64,
    time_delta_ms: Arc<AtomicI64>,
) {
    let mut timeouts = 0;
    let mut ping_id = 0;
    let mut ping_send = Utc::now();
    let mut ring_delta = RingDelta::new();

    let mut receive_msg = async || -> Result<(), Closed> {
        let msg = tokio::select! {
            _ = sleep(Duration::from_secs(4)) => {
                if timeouts < 4 {
                    timeouts += 1;
                    None
                } else {
                    return Err(Closed);
                }
            },
            msg = rx.next() => match msg {
                Some(Ok(msg)) => {
                    timeouts = 0;
                    Some(msg)
                }
                _ => return Err(Closed),
            }
        };

        let now = Utc::now();
        if let Some(msg) = msg {
            let cmd = match msg {
                actix_ws::Message::Text(byte_string) => {
                    Some(Cmd::parse_json(byte_string.as_bytes()))
                }
                actix_ws::Message::Binary(bytes) => Some(Cmd::parse_json(&bytes)),
                actix_ws::Message::Ping(bytes) => {
                    tx.pong(&bytes).await?;
                    None
                }
                actix_ws::Message::Close(_) => return Err(Closed),
                _ => None,
            };

            match cmd {
                Some(Ok(cmd)) => {
                    if let Some((pong_id, timestamp)) = cmd.pong()
                        && pong_id == ping_id
                    {
                        let delay = (now - ping_send) / 2;
                        let dest_time = timestamp + delay;
                        let time_delta = now - dest_time;
                        ring_delta.insert(time_delta);
                        time_delta_ms.store(ring_delta.avg().num_milliseconds(), Ordering::Relaxed);
                    } else {
                        let mut session = session.lock().await;
                        handle_cmd(&mut session, cmd, payload).await;
                    }
                }
                Some(Err(err)) => {
                    log::error!("error parsing websocket command: {err:?}");
                }
                None => (),
            }
        }

        if now >= ping_send + Duration::from_secs(4) {
            ping_id += 1;
            ping_send = Utc::now();
            let ping_message = serde_json::to_string(&PingCommand {
                command: "ping",
                payload: Ping { id: ping_id },
            });
            if let Ok(ping_message) = ping_message {
                tx.text(ping_message).await?;
            }
        }
        Ok(())
    };

    loop {
        if let Err(Closed) = receive_msg().await {
            handle_delete(app_data, Arc::clone(&session), socket_id, payload).await;
            return;
        }
    }
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

#[async_trait::async_trait]
impl<T: Serialize + Sync + 'static> Channel<T> for WsChannel {
    async fn send(&mut self, mut msg: Message<'_, T>) -> Result<(), ChannelError> {
        if let Some(timing) = &mut msg.timing {
            let ms = self.time_delta_ms.load(Ordering::Relaxed);
            *timing += TimeDelta::milliseconds(ms);
        }

        let message_string = serde_json::to_string(&msg).map_err(WsChannelError::Serialization)?;
        self.tx
            .text(message_string)
            .await
            .map_err(WsChannelError::Tx)?;
        Ok(())
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
