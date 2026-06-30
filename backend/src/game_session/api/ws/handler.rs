use {
    crate::{
        AppData,
        auth::User,
        error::Error,
        game_session::{
            GameSession, GameSessionError, GameSessionStatus, GameSessions, HostMessage, Message,
            SessionCode,
            api::ws::{WsJoining, channel_builder::WsChannelBuilder},
        },
    },
    actix_web::{HttpRequest, HttpResponse, rt, web},
    std::{sync::Arc, time::Duration},
    tokio::{sync::Mutex, time::sleep},
    uuid::Uuid,
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
    let channel_builder = WsChannelBuilder::new(tx, rx, app_data.clone(), session_arc);
    let channel = channel_builder.build(
        (app_data.game_sessions.clone(), code),
        GameSession::handle_host_cmd,
        remove_host_ws,
    );

    session.set_host_channel(channel).await;

    Ok(res)
}

/// Closes the session if the host doesn't reconnect within 15 minutes.
async fn remove_host_ws(
    app_data: Arc<AppData>,
    session: Arc<Mutex<GameSession>>,
    id: u64,
    (_, code): (GameSessions, SessionCode),
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

async fn get_player_ws(
    req: HttpRequest,
    body: web::Payload,
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
    let channel_builder = WsChannelBuilder::new(tx.clone(), rx, app_data, Arc::clone(&session));

    match &mut session.lock().await.status {
        GameSessionStatus::Waiting(joining) => {
            let id = channel_builder.id;
            let handle = rt::spawn(channel_builder.wait_for_join());
            joining.push(Box::new(WsJoining { id, handle, tx }));
        }
        GameSessionStatus::Closed => {
            return Err(Error::from(GameSessionError::InvalidCode).into());
        }
        _ => {
            // Game already started — wait_for_join accepts reconnect commands,
            // and rejects setName via check_add_player internally.
            rt::spawn(channel_builder.wait_for_join());
        }
    }

    Ok(res)
}

/// Immediately removes the player from the session.
pub(super) async fn remove_player_ws(
    _app_data: Arc<AppData>,
    session: Arc<Mutex<GameSession>>,
    channel_id: u64,
    player_id: Uuid,
) {
    sleep(Duration::from_mins(15)).await;
    let mut session = session.lock().await;

    if let Some(player_pos) = session.players.iter().position(|x| x.id == player_id)
        && session.players[player_pos].channel.id() == channel_id
    {
        session.players.swap_remove(player_pos);
        session
            .host
            .msg(Message::from(&HostMessage::RemovePlayer { id: player_id }))
            .await
    }
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::resource("/sessions/{code}/ws/host").route(web::get().to(get_host_ws)));
    cfg.service(web::resource("/sessions/{code}/ws/player").route(web::get().to(get_player_ws)));
}
