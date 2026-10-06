use {
    crate::{
        AppData,
        app_data::AppDataTrait,
        game_session::{GameSession, GameSessionError, SessionCode},
    },
    actix_proxy::IntoHttpResponse,
    actix_web::{
        Error, HttpMessage,
        body::MessageBody,
        dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
    },
    awc::{
        body::BoxBody,
        error::{ConnectError, SendRequestError},
    },
    deadpool_redis::redis::AsyncCommands,
    std::{
        future::{Future, Ready, ready},
        pin::Pin,
        rc::Rc,
        sync::Arc,
    },
};

pub mod ws_proxy;

static FORWARD_HEADERS: &[&str] = &[
    "accept",
    "accept-encoding",
    "accept-language",
    "user-agent",
    "cookie",
    "connection",
    "upgrade",
];

pub struct GameSessionGatewayMiddleware {
    app_data: Arc<AppData>,
}

impl GameSessionGatewayMiddleware {
    pub fn new(app_data: Arc<AppData>) -> Self {
        Self { app_data }
    }
}

impl<S, B> Transform<S, ServiceRequest> for GameSessionGatewayMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type InitError = ();
    type Transform = InnerGameSessionGatewayMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(InnerGameSessionGatewayMiddleware {
            app_data: Arc::clone(&self.app_data),
            service: Rc::new(service),
        }))
    }
}

pub struct InnerGameSessionGatewayMiddleware<S> {
    app_data: Arc<AppData>,
    service: Rc<S>,
}

enum SessionLocation {
    ThisNode,
    OtherNode(String),
    Restore,
}

impl<S, B> Service<ServiceRequest> for InnerGameSessionGatewayMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<BoxBody>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        let uri = req.uri();
        let code = uri
            .path()
            .split('/')
            .skip(2)
            .find_map(|part| part.parse::<SessionCode>().ok());

        async fn move_session(
            code: SessionCode,
            app_data: &impl AppDataTrait,
        ) -> Result<SessionLocation, GameSessionError> {
            let Some(mut redis) = app_data.redis().await? else {
                return Ok(SessionLocation::ThisNode);
            };

            let node = redis.get(format!("{{{code}}}:master")).await?;

            let available_locally = app_data
                .game_sessions()
                .sessions
                .read()
                .await
                .contains_key(&code);

            async fn remove_session(app_data: &impl AppDataTrait, code: SessionCode) {
                if let Some(session) = app_data
                    .game_sessions()
                    .sessions
                    .write()
                    .await
                    .remove(&code)
                {
                    let mut session = session.lock().await;
                    if !session.is_closed() {
                        session.close().await;
                    }
                }
            }

            if let Some(node) = node {
                if node != app_data.node() {
                    if redis
                        .hget::<_, _, Option<String>>(app_data.identifier(), &node)
                        .await?
                        .is_some()
                    {
                        if available_locally {
                            remove_session(app_data, code).await
                        }
                        Ok(SessionLocation::OtherNode(node))
                    } else {
                        Ok(SessionLocation::Restore)
                    }
                } else {
                    if available_locally {
                        Ok(SessionLocation::ThisNode)
                    } else {
                        Ok(SessionLocation::Restore)
                    }
                }
            } else {
                if available_locally {
                    remove_session(app_data, code).await
                }
                Ok(SessionLocation::ThisNode)
            }
        }

        async fn proxy(
            mut req: ServiceRequest,
            node: String,
        ) -> Result<ServiceResponse<BoxBody>, crate::error::Error> {
            let payload = req.take_payload();
            let Some(client) = req.app_data::<awc::Client>() else {
                return Err(crate::Error::Session(GameSessionError::AwcUnavailable))?;
            };

            let node_url = format!("http://{}{}", node, req.uri());
            log::debug!("Proxying request to {node_url}");

            let mut headers = Vec::with_capacity(FORWARD_HEADERS.len());

            for header_key in FORWARD_HEADERS {
                if let Some(header_value) = req.headers().get(*header_key) {
                    headers.push((*header_key, header_value));
                }
            }

            let response = if let Some(connection) = req.headers().get("connection")
                && connection == "upgrade"
                && let Some(upgrade) = req.headers().get("upgrade")
                && upgrade == "websocket"
            {
                log::debug!("Proxying websocket connection to {node}");
                ws_proxy::start(req.request(), client, node_url, payload, &headers)
                    .await
                    .map_err(crate::Error::Session)?
            } else {
                let mut proxy_req = client.request(req.method().clone(), node_url);

                for header in headers {
                    proxy_req = proxy_req.insert_header_if_none(header)
                }

                match proxy_req.send_stream(payload).await {
                    Ok(res) => Ok(res.into_http_response()),
                    Err(SendRequestError::Connect(ConnectError::Timeout))
                    | Err(SendRequestError::Timeout) => {
                        log::error!("Proxy timeout");
                        Err(GameSessionError::ProxyTimeout)
                    }
                    Err(err) => {
                        log::error!("Proxy error: {err:?}");
                        Err(GameSessionError::ProxyError)
                    }
                }
                .map_err(crate::Error::Session)?
            };
            Ok(req.into_response(response.map_into_boxed_body()))
        }

        let app_data = Arc::clone(&self.app_data);

        Box::pin(async move {
            if let Some(code) = code {
                let location = move_session(code, app_data.as_ref())
                    .await
                    .map_err(crate::Error::from)?;

                match location {
                    SessionLocation::ThisNode => (),
                    SessionLocation::OtherNode(node) => {
                        return Ok(proxy(req, node).await?);
                    }
                    SessionLocation::Restore => {
                        GameSession::restore(code, app_data.as_ref())
                            .await
                            .map_err(crate::Error::from)?;
                    }
                }
            }
            Ok(service.call(req).await?.map_into_boxed_body())
        })
    }
}
