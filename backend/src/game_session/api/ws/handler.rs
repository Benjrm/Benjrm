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

/// Upgrades the host connection to a WebSocket.
///
/// After the connection is established, the host is registered with the game.
///
/// If the host disconnects, the session remains active for up to 15 minutes to allow the host to reconnect.
/// If no reconnection occurs within that period, the session is closed automatically.
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

/// Waits 15 minutes before checking whether the disconnected host channel has been replaced.
///
/// If the host has not reconnected, the game session is removed from the session manager and all remaining connections are closed.
async fn remove_host_ws(
    app_data: Arc<AppData>,
    session: Arc<Mutex<GameSession>>,
    id: u64,
    (_, code): (GameSessions, SessionCode),
) {
    {
        let mut session = session.lock().await;
        if session.host.channel_id == id
            && let Some(channel) = session.host.channel.take()
        {
            channel.close().await;
        }
    }

    sleep(Duration::from_mins(15)).await;
    let mut session = session.lock().await;

    if session.host.channel_id == id {
        log::info!("Deleting session {code} due to inactivity");
        session.close().await;
        drop(session);
        app_data.game_sessions.drop_session(code).await;
    }
}

/// Upgrades a player connection to a WebSocket.
///
/// Player connections are only accepted while the session is in waiting state.
/// The connection enters a temporary "joining" state where it waits for a valid [`SetName`](crate::game_session::PlayerCommand::SetName).
/// While in "joining" state, the [`Reconnect`](crate::game_session::PlayerCommand::Reconnect) command is also allowed.
/// Once the player successfully joins, the connection is promoted to a normal player channel.
///
/// Returns an error if the game has already started.
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

/// Waits 15 minutes before checking whether the disconnected player channel has been replaced.
///
/// If the player has not reconnected, the player gets removed from the session while notifying the host.
pub(super) async fn remove_player_ws(
    _app_data: Arc<AppData>,
    session: Arc<Mutex<GameSession>>,
    channel_id: u64,
    player_id: Uuid,
) {
    {
        let mut session = session.lock().await;
        if let Some(player) = session.players.iter_mut().find(|x| x.id == player_id)
            && player.channel_id == channel_id
            && let Some(channel) = player.channel.take()
        {
            channel.close().await;
        }
    }

    sleep(Duration::from_mins(15)).await;
    let mut session = session.lock().await;

    if let Some(player_pos) = session.players.iter().position(|x| x.id == player_id)
        && session.players[player_pos].channel_id == channel_id
    {
        session.players.swap_remove(player_pos);
        session
            .host
            .msg(Message::from(&HostMessage::RemovePlayer { id: player_id }))
            .await
    }
}

/// Initializes the WebSocket routes for the game session API.
pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::resource("/sessions/{code}/ws/host").route(web::get().to(get_host_ws)));
    cfg.service(web::resource("/sessions/{code}/ws/player").route(web::get().to(get_player_ws)));
}
