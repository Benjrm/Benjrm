use {
    crate::game_session::{Channel, ChannelError, Message},
    actix_ws::CloseCode,
    chrono::TimeDelta,
    serde::Serialize,
    std::sync::{
        Arc,
        atomic::{AtomicI64, Ordering},
    },
    tokio::task::JoinHandle,
};

/// A WebSocket connection to a single game client.
///
/// A [`WsChannel`] owns the sending part of the WebSocket connection and the background task responsible for processing incoming messages.
/// It provides the transport layer between a player and a [`GameSession`](crate::game_session::GameSession).
///
/// Instances are typically created by using the [`WsChannelBuilder`](super::channel_builder::WsChannelBuilder) rather than constructed directly.
pub struct WsChannel {
    pub(super) id: u64,
    pub(super) tx: actix_ws::Session,
    pub(super) time_delta_ms: Arc<AtomicI64>,
    pub(super) handle: JoinHandle<()>,
}

/// Errors that can occur while sending a WebSocket message.
#[derive(Debug)]
pub enum WsChannelError {
    Serialization(serde_json::Error),
    Tx(actix_ws::Closed),
}

/// Attempts to send a message over the WebSocket connection.
///
/// Any error encountered while serializing or transmitting the message is logged.
pub(super) async fn send_msg_log_error<T: Serialize>(
    tx: &mut actix_ws::Session,
    msg: Message<'_, T>,
) {
    if let Err(err) = send_msg(tx, msg).await {
        log::error!("failed to send message: {err:?}")
    }
}

/// Sends a message over the WebSocket connection.
///
/// # Errors
///
/// - Returns [`WsChannelError::Serialization`] if the message can't be serialized to JSON
/// - or [`WsChannelError::Tx`] if the WebSocket connection is closed before the message can be sent
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
