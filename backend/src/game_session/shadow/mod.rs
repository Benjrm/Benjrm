use {
    crate::{
        app_data::{AppDataTrait, RedisConnection},
        game_session::{
            GameSession, GameSessionError, PlayableQuiz, SessionCode,
            shadow::types::{
                ShadowEvent, ShadowGameSession, ShadowGameSessionHost, ShadowGameSessionPlayer,
                ShadowGameSessionStatus,
            },
        },
    },
    deadpool_redis::redis::{self, AsyncTypedCommands, MSetOptions, SetExpiry},
    std::sync::Arc,
    tokio::sync::Mutex,
};
pub mod types;

const DEFAULT_EXPIRY: u64 = 3 * 24 * 60 * 60; // 3 Days

impl GameSession {
    pub async fn shadow_event(
        &self,
        event: ShadowEvent,
        code: SessionCode,
        app_data: &impl AppDataTrait,
    ) -> Result<(), GameSessionError> {
        let Some(mut redis) = app_data.redis().await? else {
            return Ok(());
        };

        let master = format!("{{{code}}}:master");

        if let Some(master) = redis.get(&master).await?
            && master != app_data.node()
        {
            return Err(GameSessionError::NotTheMaster);
        }

        match event {
            ShadowEvent::Init { session } => {
                if !redis::cmd("SET")
                    .arg(format!("{{{code}}}:master"))
                    .arg(app_data.node())
                    .arg("NX")
                    .arg("EX")
                    .arg(DEFAULT_EXPIRY)
                    .query_async(&mut redis)
                    .await?
                {
                    return Err(GameSessionError::CannotGenerateCode);
                }

                let status = serde_json::to_string(&session.status).unwrap();
                let quiz = serde_json::to_string(&session.quiz).unwrap();
                let players = serde_json::to_string(&session.players).unwrap();
                let host = serde_json::to_string(&session.host).unwrap();

                redis
                    .mset_ex(
                        &[
                            (format!("{{{code}}}:snapshot:status"), &status),
                            (format!("{{{code}}}:snapshot:quiz"), &quiz),
                            (format!("{{{code}}}:snapshot:players"), &players),
                            (format!("{{{code}}}:snapshot:host"), &host),
                        ],
                        MSetOptions::default().with_expiration(SetExpiry::EX(DEFAULT_EXPIRY)),
                    )
                    .await?;

                redis.del(format!("{{{code}}}:log")).await?;
            }
            ShadowEvent::EndGame => {
                ShadowGameSession::delete(app_data, code).await?;
            }
            ShadowEvent::NextQuestion { .. } => {
                let shadow: ShadowGameSession = self.into();

                let status = serde_json::to_string(&shadow.status).unwrap();
                let players = serde_json::to_string(&shadow.players).unwrap();

                redis
                    .mset_ex(
                        &[
                            (format!("{{{code}}}:snapshot:next:status"), &status),
                            (format!("{{{code}}}:snapshot:next:players"), &players),
                        ],
                        MSetOptions::default().with_expiration(SetExpiry::EX(DEFAULT_EXPIRY)),
                    )
                    .await?;

                redis
                    .rename(
                        format!("{{{code}}}:snapshot:next:status"),
                        format!("{{{code}}}:snapshot:status"),
                    )
                    .await?;
                redis
                    .rename(
                        format!("{{{code}}}:snapshot:next:players"),
                        format!("{{{code}}}:snapshot:players"),
                    )
                    .await?;

                redis.del(format!("{{{code}}}:log")).await?;
            }

            event => {
                let json = serde_json::to_string(&event).unwrap();
                let log_key = format!("{{{code}}}:log");
                redis.lpush(&log_key, json).await?;
                redis.expire(log_key, DEFAULT_EXPIRY as i64).await?;
            }
        }
        Ok(())
    }

    pub async fn restore(
        code: SessionCode,
        app_data: &impl AppDataTrait,
    ) -> Result<(), GameSessionError> {
        let Some(mut redis) = app_data.redis().await? else {
            return Ok(());
        };

        let is_master: bool = redis::cmd("SET")
            .arg(format!("{{{code}}}:next:master"))
            .arg(app_data.node())
            .arg("NX")
            .arg("PX")
            .arg(1000)
            .query_async(&mut redis)
            .await?;

        if !is_master {
            return Err(GameSessionError::ShadowRestoring);
        }

        async fn inner_restore(
            code: SessionCode,
            app_data: &impl AppDataTrait,
            redis: &mut RedisConnection,
        ) -> Result<(), GameSessionError> {
            let status = redis
                .get(format!("{{{code}}}:snapshot:status"))
                .await?
                .ok_or(GameSessionError::ShadowCantRestore("status"))?;
            let quiz = redis
                .get(format!("{{{code}}}:snapshot:quiz"))
                .await?
                .ok_or(GameSessionError::ShadowCantRestore("quiz"))?;
            let players = redis
                .get(format!("{{{code}}}:snapshot:players"))
                .await?
                .ok_or(GameSessionError::ShadowCantRestore("players"))?;
            let host = redis
                .get(format!("{{{code}}}:snapshot:host"))
                .await?
                .ok_or(GameSessionError::ShadowCantRestore("host"))?;

            // Maybe do not get the entire log in one query. Do it using an iterator or so...
            let log = redis.lrange(format!("{{{code}}}:log"), 0, -1).await?;

            let status = serde_json::from_str::<ShadowGameSessionStatus>(&status).unwrap();
            let quiz = serde_json::from_str::<Option<PlayableQuiz>>(&quiz).unwrap();
            let players = serde_json::from_str::<Vec<ShadowGameSessionPlayer>>(&players).unwrap();
            let host = serde_json::from_str::<ShadowGameSessionHost>(&host).unwrap();

            let log = log.iter().filter_map(|event| {
                let event = serde_json::from_str::<ShadowEvent>(event);
                match event {
                    Ok(event) => Some(event),
                    Err(err) => {
                        log::error!(
                            "Can't fully restore session {code} due to a serialization error: {err:?}"
                        );
                        None
                    }
                }
            });

            let mut shadow = ShadowGameSession {
                status,
                host,
                players,
                quiz: quiz.map(Arc::new),
                code,
            };

            for event in log.rev() {
                if let Err(err) = shadow.apply_event(event) {
                    log::error!("Can't fully restore session {code}: {err:?}");
                }
            }

            let mut sessions = app_data.game_sessions().sessions.write().await;
            sessions.insert(code, Arc::new(Mutex::new((&shadow).into())));

            redis
                .set(format!("{{{code}}}:master"), app_data.node())
                .await?;

            Ok(())
        }

        let result = inner_restore(code, app_data, &mut redis).await;
        redis.del(format!("{{{code}}}:next:master")).await?;
        result
    }
}

impl ShadowGameSession {
    pub fn apply_event(&mut self, event: ShadowEvent) -> Result<(), crate::error::Error> {
        match event {
            ShadowEvent::Init { .. } | ShadowEvent::EndGame => {
                unreachable!("ShadowEvent::Init or ShadowEvent::EndGame should not be restorable")
            }
            ShadowEvent::KickPlayer { player } => {
                if let Some(player_index) = self.players.iter().position(|p| p.id == player) {
                    self.players.swap_remove(player_index);
                };
            }
            ShadowEvent::StartQuiz => {
                self.status = ShadowGameSessionStatus::Started;
            }
            ShadowEvent::NextQuestion {
                question: idx,
                started,
                options_len,
                leaderboard,
            } => {
                self.status = ShadowGameSessionStatus::Question {
                    idx,
                    started,
                    answers: 0,
                    answer_distribution: vec![0; options_len],
                    leaderboard,
                };
            }
            ShadowEvent::Leaderboard {
                idx,
                statistics,
                leaderboard,
                is_final,
            } => {
                self.status = ShadowGameSessionStatus::Leaderboard {
                    idx,
                    statistics: statistics.map(Arc::new),
                    leaderboard: Arc::new(leaderboard),
                    is_final,
                };

                for player in &mut self.players {
                    if let Some((points, _)) = player.last_question.take() {
                        player.points += points
                    }
                }
            }
            ShadowEvent::ShowPodium => {
                if let ShadowGameSessionStatus::Leaderboard { leaderboard, .. } = &self.status {
                    self.status = ShadowGameSessionStatus::Podium(Arc::clone(leaderboard))
                } else {
                    return Err(GameSessionError::ShadowInvalidSessionStatus)?;
                };
            }
            ShadowEvent::RenamePlayer {
                player,
                name,
                emoji,
            } => {
                if let Some(player) = self.players.iter_mut().find(|p| p.id == player) {
                    player.name = name;
                    player.emoji = emoji
                } else {
                    Err(GameSessionError::PlayerNotFound)?
                }
            }
            ShadowEvent::PlayerAddPoints {
                player,
                points,
                question,
            } => {
                if let Some(player) = self.players.iter_mut().find(|p| p.id == player) {
                    player.last_question = Some((points, question));
                } else {
                    Err(GameSessionError::PlayerNotFound)?
                }
            }
            ShadowEvent::UpdateAnswers {
                answers: new_answers,
                distribution: new_distribution,
            } => {
                if let ShadowGameSessionStatus::Question {
                    answers,
                    answer_distribution,
                    ..
                } = &mut self.status
                {
                    *answers = new_answers;
                    *answer_distribution = new_distribution;
                } else {
                    Err(GameSessionError::ShadowInvalidSessionStatus)?
                }
            }
            ShadowEvent::AddPlayer {
                id,
                secret,
                name,
                emoji,
            } => {
                if self.players.iter().find(|player| player.id == id).is_none() {
                    self.players.push(ShadowGameSessionPlayer {
                        id,
                        secret,
                        name,
                        emoji,
                        points: 0,
                        last_question: None,
                    });
                } else {
                    Err(GameSessionError::ShadowPlayerAlreadyPresent)?
                }
            }
        }

        Ok(())
    }

    pub async fn delete(
        app_data: &impl AppDataTrait,
        code: SessionCode,
    ) -> Result<(), GameSessionError> {
        let Some(mut redis) = app_data.redis().await? else {
            return Ok(());
        };

        let master: Option<String> = redis.get(format!("{{{code}}}:master")).await?;

        if let Some(master) = master
            && master != app_data.node()
            && redis.hexists(app_data.identifier(), master).await?
        {
            return Ok(());
        }

        redis::cmd("DEL")
            .arg(format!("{{{code}}}:master"))
            .arg(format!("{{{code}}}:next:master"))
            .arg(format!("{{{code}}}:log"))
            .arg(format!("{{{code}}}:master"))
            .arg(format!("{{{code}}}:snapshot:next:status"))
            .arg(format!("{{{code}}}:snapshot:next:players"))
            .arg(format!("{{{code}}}:snapshot:status"))
            .arg(format!("{{{code}}}:snapshot:quiz"))
            .arg(format!("{{{code}}}:snapshot:players"))
            .arg(format!("{{{code}}}:snapshot:host"))
            .query_async::<usize>(&mut redis)
            .await?;

        Ok(())
    }
}
