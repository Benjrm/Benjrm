use {
    crate::{
        AppData,
        app_data::{AppDataTrait, RedisConnection},
        game_session::{GameSessionError, SessionCode},
    },
    actix_proxy::IntoHttpResponse,
    actix_web::{
        Error, HttpMessage, HttpResponse,
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
    port: u16,
}

impl GameSessionGatewayMiddleware {
    pub fn new(app_data: Arc<AppData>, port: u16) -> Self {
        Self { app_data, port }
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
            port: self.port,
            service: Rc::new(service),
        }))
    }
}

pub struct InnerGameSessionGatewayMiddleware<S> {
    app_data: Arc<AppData>,
    port: u16,
    service: Rc<S>,
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
            mut redis: RedisConnection,
            app_data: Arc<AppData>,
        ) -> Result<Option<String>, GameSessionError> {
            if !app_data
                .game_sessions()
                .sessions
                .read()
                .await
                .contains_key(&code)
            {
                let node = redis.get::<_, Option<String>>(code).await?;

                if let Some(node) = node
                    && node != app_data.node()
                {
                    return Ok(Some(node));
                }
            }
            Ok(None)
        }

        async fn proxy(
            mut req: ServiceRequest,
            node: String,
            port: u16,
        ) -> Result<ServiceResponse<BoxBody>, Error> {
            let payload = req.take_payload();
            let Some(client) = req.app_data::<awc::Client>() else {
                return Err(crate::Error::Session(GameSessionError::AwcUnavailable()))?;
            };

            let node_url = format!("http://{}:{}{}", node, port, req.uri());

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

                log::debug!("Proxying request to {node}");
                let x: Result<HttpResponse, GameSessionError> =
                    match proxy_req.send_stream(payload).await {
                        Ok(res) => Ok(res.into_http_response()),
                        Err(SendRequestError::Connect(ConnectError::Timeout))
                        | Err(SendRequestError::Timeout) => {
                            log::error!("Proxy timeout");
                            Err(GameSessionError::ProxyTimeout())
                        }
                        Err(err) => {
                            log::error!("Proxy error: {err:?}");
                            Err(GameSessionError::ProxyError())
                        }
                    };

                x.map_err(crate::Error::Session)?
            };
            Ok(req.into_response(response.map_into_boxed_body()))
        }

        let app_data = Arc::clone(&self.app_data);
        let port = self.port;

        Box::pin(async move {
            let res = if let Some(redis) = app_data
                .redis()
                .await
                .map_err(|e| crate::Error::from(GameSessionError::from(e)))?
                && let Some(code) = code
                && let Some(node) = move_session(code, redis, Arc::clone(&app_data))
                    .await
                    .map_err(crate::Error::from)?
            {
                proxy(req, node, port).await?
            } else {
                service.call(req).await?.map_into_boxed_body()
            };

            Ok(res)
        })
    }
}
