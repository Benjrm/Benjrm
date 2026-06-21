use {
    crate::{
        error::Error,
        game_session::{
            CommandTrait, Message,
            api::ws::{Ping, PingCommand, Response},
        },
    },
    actix_ws::{Closed, MessageStream},
    chrono::{DateTime, TimeDelta, Utc},
    futures::StreamExt,
    std::{
        sync::{
            Arc,
            atomic::{AtomicI64, Ordering},
        },
        time::Duration,
    },
    tokio::time::sleep,
};

pub(super) struct InnerChannel {
    pub(super) tx: actix_ws::Session,
    pub(super) rx: MessageStream,
    pub(super) timeouts: u32,
    pub(super) ping_id: u32,
    pub(super) ping_send: DateTime<Utc>,
    pub(super) time_delta_ms: Arc<AtomicI64>,
    pub(super) ring_delta: RingDelta,
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

    pub async fn recv<Cmd: CommandTrait>(&mut self) -> Result<Option<Cmd>, Closed> {
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

    async fn msg(&mut self, id: Option<u64>, msg: &Response) {
        let msg = Message {
            id,
            msg,
            timing: None,
        };
        if let Ok(message_string) = serde_json::to_string(&msg) {
            let _ = self.tx.text(message_string).await;
        }
    }

    pub(super) async fn ok(&mut self, id: Option<u64>) {
        self.msg(id, &Response::Ok).await;
    }

    pub(super) async fn error(&mut self, id: Option<u64>, err: Error) {
        self.msg(id, &Response::Error(err.into())).await;
    }
}

pub(super) struct RingDelta {
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
