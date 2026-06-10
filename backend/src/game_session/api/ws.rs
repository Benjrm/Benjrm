use {
    crate::{
        AppData,
        auth::User,
        error::Error,
        game_session::{
            Channel, ChannelError, Command, GameSession, HostCommand, Message, SessionCode,
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
    let channel = WsChannel::new::<HostCommand, _, _>(
        rx,
        tx,
        app_data,
        session_arc,
        code,
        handle_host_cmd,
        remove_host_ws,
    );
    session.set_host_channel(channel).await;

    Ok(res)
}

async fn handle_host_cmd(_session: Arc<Mutex<GameSession>>, cmd: HostCommand) {
    log::debug!("host cmd: {cmd:?}");
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

pub struct WsChannel {
    id: u64,
    tx: actix_ws::Session,
    time_delta_ms: Arc<AtomicI64>,
    handle: JoinHandle<()>,
}

impl WsChannel {
    pub fn new<
        Cmd: Command + 'static,
        HandleCmd: AsyncFn(Arc<Mutex<GameSession>>, Cmd) + Send + 'static,
        HandleDelete: AsyncFn(web::Data<AppData>, Arc<Mutex<GameSession>>, u64, SessionCode) + Send + 'static,
    >(
        rx: MessageStream,
        tx: actix_ws::Session,
        app_data: web::Data<AppData>,
        session: Arc<Mutex<GameSession>>,
        session_code: SessionCode,
        handle_cmd: HandleCmd,
        handle_delete: HandleDelete,
    ) -> Self {
        let id = <Self as Channel<()>>::generate_id();
        let time_delta_ms = Arc::new(AtomicI64::new(0));
        let handle = rt::spawn(ws_listener::<Cmd, _, _>(
            rx,
            tx.clone(),
            app_data,
            session,
            session_code,
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
    Cmd: Command,
    HandleCmd: AsyncFn(Arc<Mutex<GameSession>>, Cmd) + Send,
    HandleDelete: AsyncFn(web::Data<AppData>, Arc<Mutex<GameSession>>, u64, SessionCode) + Send,
>(
    mut rx: MessageStream,
    mut tx: actix_ws::Session,
    app_data: web::Data<AppData>,
    session: Arc<Mutex<GameSession>>,
    session_code: SessionCode,
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
                    }

                    handle_cmd(Arc::clone(&session), cmd).await;
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
            handle_delete(app_data, Arc::clone(&session), socket_id, session_code).await;
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
impl<T: Serialize + Send + 'static> Channel<T> for WsChannel {
    async fn send(&mut self, mut msg: Message<T>) -> Result<(), ChannelError> {
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
}
