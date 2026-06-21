use {
    crate::{
        error::ErrorResponse,
        game_session::{Joining, PlayerMessage},
    },
    actix_ws::CloseCode,
    serde::Serialize,
    std::fmt,
    tokio::task::JoinHandle,
};

mod channel;
mod channel_builder;
mod handler;
mod inner_channel;

pub use {channel::WsChannelError, handler::init};

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

#[derive(Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
enum Response {
    Ok,
    Error(ErrorResponse),
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
