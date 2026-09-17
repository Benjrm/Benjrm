use {
    crate::game_session::GameSessionError,
    actix::{
        Actor, ActorContext, AsyncContext, StreamHandler,
        io::{SinkWrite, WriteHandler},
    },
    actix_web::{HttpRequest, HttpResponse, error::PayloadError},
    actix_web_actors::ws::{self, CloseReason, ProtocolError, WebsocketContext, handshake},
    awc::error::HeaderValue,
    bytes::Bytes,
    futures::{Sink, Stream, StreamExt},
    std::error::Error,
};
pub struct WebsocketProxy<S>
where
    S: Unpin + Sink<ws::Message>,
{
    send: SinkWrite<ws::Message, S>,
}

impl<S> WebsocketProxy<S>
where
    S: Unpin + Sink<ws::Message> + 'static,
{
    fn error<E>(&mut self, err: E, ctx: &mut <Self as Actor>::Context)
    where
        E: Error,
    {
        let reason = Some(CloseReason {
            code: ws::CloseCode::Error,
            description: Some(err.to_string()),
        });

        ctx.close(reason.clone());
        let _ = self.send.write(ws::Message::Close(reason)); // if we can't send an error message, so it goes
        self.send.close();

        ctx.stop();
    }
}

pub async fn start<T>(
    req: &HttpRequest,
    client: &awc::Client,
    target: String,
    stream: T,
    headers: &Vec<(&str, &HeaderValue)>,
) -> Result<HttpResponse, GameSessionError>
where
    T: Stream<Item = Result<Bytes, PayloadError>> + 'static,
{
    let mut res = handshake(req)?;
    let mut proxy_req = client.ws(target);

    for (header_key, header_value) in headers {
        proxy_req = proxy_req.set_header_if_none(*header_key, *header_value);
    }

    let (_, conn) = proxy_req.connect().await?;

    let (send, recv) = conn.split();

    let out = WebsocketContext::with_factory(stream, |ctx| {
        ctx.add_stream(recv);
        WebsocketProxy {
            send: SinkWrite::new(send, ctx),
        }
    });

    Ok(res.streaming(out))
}

impl<S> WriteHandler<ProtocolError> for WebsocketProxy<S>
where
    S: Unpin + 'static + Sink<ws::Message>,
{
    fn error(&mut self, err: ProtocolError, ctx: &mut Self::Context) -> actix::Running {
        self.error(err, ctx);
        actix::Running::Stop
    }
}

impl<S> Actor for WebsocketProxy<S>
where
    S: Unpin + 'static + Sink<ws::Message>,
{
    type Context = WebsocketContext<Self>;
}

impl<S> StreamHandler<Result<ws::Frame, ProtocolError>> for WebsocketProxy<S>
where
    S: Unpin + Sink<ws::Message> + 'static,
{
    fn handle(&mut self, item: Result<ws::Frame, ProtocolError>, ctx: &mut Self::Context) {
        let frame = match item {
            Ok(frame) => frame,
            Err(err) => return self.error(err, ctx),
        };
        let msg = match frame {
            ws::Frame::Text(t) => match t.try_into() {
                Ok(t) => ws::Message::Text(t),
                Err(err) => {
                    self.error(err, ctx);
                    return;
                }
            },
            ws::Frame::Binary(b) => ws::Message::Binary(b),
            ws::Frame::Continuation(c) => ws::Message::Continuation(c),
            ws::Frame::Ping(p) => ws::Message::Ping(p),
            ws::Frame::Pong(p) => ws::Message::Pong(p),
            ws::Frame::Close(r) => ws::Message::Close(r),
        };

        ctx.write_raw(msg)
    }
}

impl<S> StreamHandler<Result<ws::Message, ProtocolError>> for WebsocketProxy<S>
where
    S: Unpin + Sink<ws::Message> + 'static,
{
    fn handle(&mut self, item: Result<ws::Message, ProtocolError>, ctx: &mut Self::Context) {
        let msg = match item {
            Ok(msg) => msg,
            Err(err) => return self.error(err, ctx),
        };

        let _ = self.send.write(msg);
    }
}
