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

/// A struct representing a player who is in the process of joining a game session via WebSocket.
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

/// A struct representing the ancknowladgement of a ping message sent by the client over WebSocket.
#[derive(Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
enum Response {
    Ok,
    Error(ErrorResponse),
}

/// The ping payload sent over WebSockets.
#[derive(Serialize)]
struct Ping {
    id: u32,
}

/// A struct wrapping a [`Ping`] into a command similar to [`HostCommand`](crate::game_session::HostCommand) or [`PlayerCommand`](crate::game_session::PlayerCommand).
#[derive(Serialize)]
struct PingCommand {
    command: &'static str,
    payload: Ping,
}
