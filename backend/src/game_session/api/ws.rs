use {
    crate::{
        AppData,
        auth::User,
        error::Error,
        game_session::{Channel, ChannelError, GameSession, HostMessage, Message},
    },
    actix_web::{HttpRequest, HttpResponse, rt, web},
    actix_ws::{CloseCode, Closed, MessageStream},
    futures::StreamExt,
    std::{sync::Arc, time::Duration},
    tokio::{sync::Mutex, task::JoinHandle, time::sleep},
};

async fn get_host_ws(
    req: HttpRequest,
    body: web::Payload,
    user: User,
    code: web::Path<u32>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse, actix_web::Error> {
    let session = app_data
        .game_sessions
        .get_session(code.into_inner())
        .await
        .map_err(Error::from)?;
    let (res, tx, rx) = actix_ws::handle(&req, body)?;

    let session_arc = Arc::clone(&session);
    let mut session = session.lock().await;

    session.check_set_host_channel(&user).map_err(Error::from)?;
    let channel = WsChannel::new(tx, |id, tx| rt::spawn(host_ws(session_arc, tx, rx, id)));
    session
        .set_host_channel(&user, channel)
        .await
        .map_err(Error::from)?;

    Ok(res)
}

async fn host_ws(
    session: Arc<Mutex<GameSession>>,
    mut tx: actix_ws::Session,
    mut rx: MessageStream,
    id: u64,
) {
    let mut timeouts = 0;

    let mut receive_msg = async || -> Result<(), Closed> {
        let msg = tokio::select! {
            _ = sleep(Duration::from_secs(5)) => {
                if timeouts < 4 {
                    timeouts += 1;
                    tx.ping(&[]).await?;
                    return Ok(());
                }
                return Err(Closed);
            },
            msg = rx.next() => match msg {
                Some(Ok(msg)) => {
                    timeouts = 0;
                    msg
                }
                _ => return Err(Closed),
            }
        };

        match msg {
            actix_ws::Message::Text(byte_string) => {
                tx.text(byte_string).await?;
            }
            actix_ws::Message::Ping(bytes) => {
                tx.pong(&bytes).await?;
            }
            actix_ws::Message::Close(_) => return Err(Closed),
            _ => (),
        }
        Ok(())
    };

    loop {
        if let Err(Closed) = receive_msg().await {
            break;
        }
    }

    let mut session = session.lock().await;
    if let Some(channel) = &session.host.channel
        && channel.id() == id
    {
        session.host.channel = None;
    }
}

pub struct WsChannel {
    id: u64,
    tx: actix_ws::Session,
    handle: JoinHandle<()>,
}

impl WsChannel {
    pub fn new(
        tx: actix_ws::Session,
        spawn_listener: impl FnOnce(u64, actix_ws::Session) -> JoinHandle<()>,
    ) -> Self {
        let id = Self::generate_id();
        let handle = spawn_listener(id, tx.clone());
        Self { id, tx, handle }
    }
}

#[async_trait::async_trait]
impl Channel<HostMessage> for WsChannel {
    async fn send(&mut self, msg: Message<HostMessage>) -> Result<(), ChannelError> {
        let message_string = serde_json::to_string(&msg).map_err(WsChannelError::Serializaton)?;
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
    Serializaton(serde_json::Error),
    Tx(actix_ws::Closed),
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::resource("/sessions/{code}/ws/host").route(web::get().to(get_host_ws)));
}
