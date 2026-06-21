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

pub struct WsChannel {
    pub(super) id: u64,
    pub(super) tx: actix_ws::Session,
    pub(super) time_delta_ms: Arc<AtomicI64>,
    pub(super) handle: JoinHandle<()>,
}

#[derive(Debug)]
pub enum WsChannelError {
    Serialization(serde_json::Error),
    Tx(actix_ws::Closed),
}

pub(super) async fn send_msg_log_error<T: Serialize>(
    tx: &mut actix_ws::Session,
    msg: Message<'_, T>,
) {
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
