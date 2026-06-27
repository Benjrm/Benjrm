use {
    crate::{
        app_data::TestAppData,
        auth::User,
        error::Error,
        game_session::{
            AnswerStatistics, Channel, ChannelError, Command, DisplayQuestionMessage,
            DisplayQuestionOptions, GameSession, GameSessionError, HostCommand, HostMessage,
            Message, PlayerCommand, PlayerMessage, api::ws::WsChannelError,
        },
        question::{
            NewQuestion, NewQuestionOptions, Question,
            answer::{choice::NewAnswerChoice, order::NewAnswerOrder},
        },
        quiz::{QuizError, test::create_one},
    },
    actix_ws::Closed,
    serde::Serialize,
    std::sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    tokio::sync::{Mutex, mpsc},
    uuid::Uuid,
};

struct DummyChanel<T> {
    id: u64,
    closed: Arc<AtomicBool>,
    sender: mpsc::Sender<T>,
}

impl<T: Serialize + Sync + Send + Clone> DummyChanel<T> {
    pub fn new() -> (Self, Arc<AtomicBool>, mpsc::Receiver<T>) {
        let (sender, receiver) = mpsc::channel(10);
        let closed = Arc::new(AtomicBool::new(false));
        let _self = Self {
            id: <Self as Channel<T>>::generate_id(),
            closed: closed.clone(),
            sender,
        };
        (_self, closed, receiver)
    }
}

#[async_trait::async_trait]
impl<T: Serialize + Sync + Send + Clone> Channel<T> for DummyChanel<T> {
    async fn send(&mut self, msg: Message<'_, T>) -> Result<(), ChannelError> {
        match self.closed.load(Ordering::Relaxed) {
            true => Err(WsChannelError::Tx(Closed).into()),
            false => self
                .sender
                .send(msg.msg.clone())
                .await
                .map_err(|_| WsChannelError::Tx(Closed).into()),
        }
    }
    async fn close(self: Box<Self>) {
        self.closed.store(true, Ordering::Relaxed);
    }
    fn id(&self) -> u64 {
        self.id
    }
}

lazy_static::lazy_static! {
    static ref DUMMY_CHOICE_ANSWERS: Vec<NewAnswerChoice> = vec![
        NewAnswerChoice { answer: "correct1".into(), correct: true},
        NewAnswerChoice { answer: "correct2".into(), correct: true},
        NewAnswerChoice { answer: "wrong1".into(), correct: false},
        NewAnswerChoice { answer: "wrong2".into(), correct: false},
    ];
    static ref DUMMY_ORDER_ANSWERS: Vec<NewAnswerOrder> = vec![
        NewAnswerOrder { answer: "item 1".into()},
        NewAnswerOrder { answer: "item 2".into()},
        NewAnswerOrder { answer: "item 3".into(), },
        NewAnswerOrder { answer: "item 4".into(), },
    ];

    static ref DUMMY_QUESTIONS: Vec<NewQuestion> = vec![
        NewQuestion {
            question: "slide".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::Slide,
        },
        NewQuestion {
            question: "single choice".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::SingleChoice(DUMMY_CHOICE_ANSWERS.clone()),
        },
        NewQuestion {
            question: "multiple choice".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::MultipleChoice(DUMMY_CHOICE_ANSWERS.clone()),
        },
        NewQuestion {
            question: "order".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::Order(DUMMY_ORDER_ANSWERS.clone()),
        }
    ];
}

async fn dummy_session(
    data: &TestAppData,
    user: &User,
    with_quiz: bool,
) -> (u32, Arc<Mutex<GameSession>>) {
    let quiz = match with_quiz {
        true => {
            let quiz = create_one(&data.db, user.id, Some("test quiz".into()), None, false)
                .await
                .unwrap();
            for question in &*DUMMY_QUESTIONS {
                quiz.clone()
                    .create_question(&data.db, question.clone())
                    .await
                    .unwrap();
            }
            Some(quiz.id)
        }
        false => None,
    };
    data.game_sessions
        .create_session(&data.db, user.clone(), quiz)
        .await
        .unwrap()
}

async fn dummy_player(
    session: &mut GameSession,
    host_rx: &mut mpsc::Receiver<HostMessage>,
    name: &str,
) -> (Uuid, mpsc::Receiver<PlayerMessage>) {
    let player = Uuid::new_v4();
    let (player_channel, _, player_rx) = DummyChanel::new();
    session.check_add_player(name).unwrap();
    session
        .add_player(player, player_channel, name.into(), None)
        .await;

    match host_rx.recv().await.unwrap() {
        HostMessage::AddPlayer {
            id,
            name: player_name,
            emoji,
        } => {
            assert_eq!(id, player);
            assert_eq!(player_name, name);
            assert_eq!(emoji, None);
        }
        x => panic!("invalid message: {x:?}"),
    }

    (player, player_rx)
}

#[actix_web::test]
async fn create_get_session() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    {
        let (code, _) = dummy_session(&data, &user, false).await;
        let session = data.game_sessions.get_session(code).await.unwrap();
        let session = session.lock().await;
        assert_eq!(session.host.user.id, user.id);
        assert!(session.quiz.is_none());
    }

    {
        let quiz = create_one(&data.db, user.id, Some("test quiz".into()), None, false)
            .await
            .unwrap();
        let (code, _) = data
            .game_sessions
            .create_session(&data.db, user.clone(), Some(quiz.id))
            .await
            .unwrap();
        let session = data.game_sessions.get_session(code).await.unwrap();
        let session = session.lock().await;

        assert_eq!(session.host.user.id, user.id);
        let session_quiz = session.quiz.as_ref().unwrap();
        assert_eq!(session_quiz.model.id, quiz.id);
    }

    assert!(matches!(
        data.game_sessions.get_session(u32::MAX).await,
        Err(GameSessionError::InvalidCode)
    ))
}

#[actix_web::test]
async fn check_set_host_channel() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let (_, session) = dummy_session(&data, &user, false).await;
    let mut session = session.lock().await;

    session.check_set_host_channel(&user).unwrap();
    let (channel1, closed1, _) = DummyChanel::new();
    session.set_host_channel(channel1).await;
    session.check_set_host_channel(&user).unwrap();
    assert!(!closed1.load(Ordering::Relaxed));

    let (channel2, closed2, _) = DummyChanel::new();
    session.set_host_channel(channel2).await;
    assert!(closed1.load(Ordering::Relaxed));
    assert!(!closed2.load(Ordering::Relaxed));

    let user2 = data.dummy_user().await;
    assert!(matches!(
        session.check_set_host_channel(&user2),
        Err(GameSessionError::Forbidden)
    ));
}

#[actix_web::test]
async fn create_session_invalid_quiz() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;
    let user2 = data.dummy_user().await;

    let res = data
        .game_sessions
        .create_session(&data.db, user.clone(), Some(Uuid::new_v4()))
        .await;
    assert!(matches!(res, Err(Error::Quiz(QuizError::NotFound))));

    let quiz = create_one(&data.db, user.id, Some("test quiz".into()), None, false)
        .await
        .unwrap();
    let res = data
        .game_sessions
        .create_session(&data.db, user2, Some(quiz.id))
        .await;
    assert!(matches!(res, Err(Error::Quiz(QuizError::Forbidden))));
}

#[actix_web::test]
async fn delete_session() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;
    let wrong_user = data.dummy_user().await;

    let (code, _) = dummy_session(&data, &user, false).await;

    assert!(matches!(
        data.game_sessions.delete_session(&wrong_user, code).await,
        Err(GameSessionError::Forbidden)
    ));
    assert!(data.game_sessions.get_session(code).await.is_ok());

    data.game_sessions
        .delete_session(&user, code)
        .await
        .unwrap();
    assert!(matches!(
        data.game_sessions.get_session(code).await,
        Err(GameSessionError::InvalidCode)
    ));
}

#[actix_web::test]
async fn join() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let (code, session_arc) = dummy_session(&data, &user, false).await;
    let mut session = session_arc.lock().await;

    let (host_channel, _, mut host_rx) = DummyChanel::new();
    let player = Uuid::new_v4();
    let (player_channel, player_closed, mut player_rx) = DummyChanel::new();

    {
        session.set_host_channel(host_channel).await;
        session.check_add_player("cool name").unwrap();
        session
            .add_player(
                player,
                player_channel,
                "cool name".into(),
                Some(emojis::get("😀").unwrap()),
            )
            .await;

        match host_rx.recv().await.unwrap() {
            HostMessage::AddPlayer { id, name, emoji } => {
                assert_eq!(id, player);
                assert_eq!(name, "cool name");
                assert_eq!(emoji, Some(emojis::get("😀").unwrap()));
            }
            x => panic!("invalid message: {x:?}"),
        }
    }

    assert!(matches!(
        session.check_add_player("cool name"),
        Err(GameSessionError::NameAlreadyTaken)
    ));

    {
        session
            .handle_host_cmd(
                Command {
                    id: Some(2),
                    command: HostCommand::KickPlayer { id: player },
                },
                session_arc.clone(),
                code,
            )
            .await
            .unwrap();

        match host_rx.recv().await.unwrap() {
            HostMessage::RemovePlayer { id } => assert_eq!(id, player),
            x => panic!("invalid message: {x:?}"),
        }
        assert!(matches!(
            player_rx.recv().await.unwrap(),
            PlayerMessage::Kick
        ));
        assert!(player_closed.load(Ordering::Relaxed));
    }
}

#[actix_web::test]
async fn rename_player() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let (_, session_arc) = dummy_session(&data, &user, false).await;
    let mut session = session_arc.lock().await;

    let (host_channel, _, mut host_rx) = DummyChanel::new();
    session.set_host_channel(host_channel).await;

    let (player, _) = dummy_player(&mut session, &mut host_rx, "name").await;
    session
        .handle_player_cmd(
            Command {
                id: Some(1),
                command: PlayerCommand::SetName {
                    name: "name2".into(),
                    emoji: Some("😀".into()),
                },
            },
            session_arc.clone(),
            player,
        )
        .await
        .unwrap();

    match host_rx.recv().await.unwrap() {
        HostMessage::RenamePlayer { id, name, emoji } => {
            assert_eq!(id, player);
            assert_eq!(name, "name2");
            assert_eq!(emoji, Some(emojis::get("😀").unwrap()));
        }
        x => panic!("invalid message: {x:?}"),
    }
}

#[actix_web::test]
async fn start() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    {
        let (code, session_arc) = dummy_session(&data, &user, false).await;
        let mut session = session_arc.lock().await;

        let (channel, _, _) = DummyChanel::new();
        session.set_host_channel(channel).await;

        let res = session
            .handle_host_cmd(
                Command {
                    id: Some(1),
                    command: HostCommand::Start,
                },
                session_arc.clone(),
                code,
            )
            .await;
        assert!(matches!(res, Err(GameSessionError::QuizMissing)));
    }

    {
        let (code, session_arc) = dummy_session(&data, &user, true).await;
        let mut session = session_arc.lock().await;

        let (channel, _, mut rx) = DummyChanel::new();
        session.set_host_channel(channel).await;

        let res = session
            .handle_host_cmd(
                Command {
                    id: Some(1),
                    command: HostCommand::Start,
                },
                session_arc.clone(),
                code,
            )
            .await;
        assert!(matches!(res, Err(GameSessionError::NoPlayers)));

        let player = Uuid::new_v4();
        let (player_channel, _, mut player_rx) = DummyChanel::new();
        session.check_add_player("test").unwrap();
        session
            .add_player(player, player_channel, "test".into(), None)
            .await;

        match rx.recv().await.unwrap() {
            HostMessage::AddPlayer { id, name, emoji } => {
                assert_eq!(id, player);
                assert_eq!(name, "test");
                assert_eq!(emoji, None);
            }
            x => panic!("invalid message: {x:?}"),
        }

        session
            .handle_host_cmd(
                Command {
                    id: Some(2),
                    command: HostCommand::Start,
                },
                session_arc.clone(),
                code,
            )
            .await
            .unwrap();
        assert!(matches!(
            player_rx.recv().await.unwrap(),
            PlayerMessage::Start
        ));

        assert!(matches!(
            session.check_add_player("some name"),
            Err(GameSessionError::AlreadyStarted)
        ));

        let res = session
            .handle_host_cmd(
                Command {
                    id: Some(2),
                    command: HostCommand::Start,
                },
                session_arc.clone(),
                code,
            )
            .await;
        assert!(matches!(res, Err(GameSessionError::AlreadyStarted)));
    }
}

#[actix_web::test]
async fn kick_on_start() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let (code, session_arc) = dummy_session(&data, &user, true).await;
    let mut session = session_arc.lock().await;

    let (host_channel, _, mut host_rx) = DummyChanel::new();
    session.set_host_channel(host_channel).await;

    let (_, mut player1_rx) = dummy_player(&mut session, &mut host_rx, "test").await;

    session
        .handle_host_cmd(
            Command {
                id: Some(1),
                command: HostCommand::Start,
            },
            session_arc.clone(),
            code,
        )
        .await
        .unwrap();
    assert!(matches!(
        player1_rx.recv().await.unwrap(),
        PlayerMessage::Start
    ));

    assert!(matches!(
        session.check_add_player("test2"),
        Err(GameSessionError::AlreadyStarted)
    ));
}

#[actix_web::test]
async fn show_question() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let (code, session_arc) = dummy_session(&data, &user, true).await;
    let mut session = session_arc.lock().await;

    let (channel, _, mut rx) = DummyChanel::new();
    session.set_host_channel(channel).await;

    let (_, mut player_rx) = dummy_player(&mut session, &mut rx, "player name").await;
    session
        .handle_host_cmd(
            Command {
                id: Some(1),
                command: HostCommand::Start,
            },
            session_arc.clone(),
            code,
        )
        .await
        .unwrap();
    assert!(matches!(
        player_rx.recv().await.unwrap(),
        PlayerMessage::Start
    ));

    let quiz = session.quiz.clone().unwrap();
    let mut check_question_command = async |command: HostCommand, expected: &Question| {
        fn check_question(
            host: Arc<DisplayQuestionMessage>,
            player: Arc<DisplayQuestionMessage>,
            expected: &Question,
        ) {
            assert_eq!(host.id, expected.model.id);
            assert_eq!(host.question, expected.model.question);
            assert_eq!(player.id, expected.model.id);
            assert_eq!(player.question, expected.model.question);
        }

        session
            .handle_host_cmd(
                Command {
                    id: Some(2),
                    command,
                },
                session_arc.clone(),
                code,
            )
            .await
            .unwrap();

        let mut host_question = None;
        while host_question.is_none() {
            match rx.recv().await.unwrap() {
                HostMessage::DisplayQuestion(question) => host_question = Some(question),
                HostMessage::DisplayLeaderboard { .. } => (),
                HostMessage::ShowStatistics { .. } => (),
                x => panic!("invalid message: {x:?}"),
            }
        }

        let mut player_question = None;
        while player_question.is_none() {
            match player_rx.recv().await.unwrap() {
                PlayerMessage::DisplayQuestion(question) => player_question = Some(question),
                PlayerMessage::QuestionResult { .. } => (),
                x => panic!("invalid message: {x:?}"),
            }
        }

        check_question(host_question.unwrap(), player_question.unwrap(), expected);
    };

    check_question_command(HostCommand::NextQuestion, &quiz.questions[0]).await;
    check_question_command(HostCommand::NextQuestion, &quiz.questions[1]).await;
    check_question_command(
        HostCommand::ShowQuestion {
            id: quiz.questions[0].model.id,
        },
        &quiz.questions[0],
    )
    .await;
    check_question_command(
        HostCommand::ShowQuestion {
            id: quiz.questions[2].model.id,
        },
        &quiz.questions[2],
    )
    .await;
}

#[actix_web::test]
async fn play_dummy_quiz() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let (code, session_arc) = dummy_session(&data, &user, true).await;
    let mut session = session_arc.lock().await;

    let (host_channel, _, mut host_rx) = DummyChanel::new();
    session.set_host_channel(host_channel).await;

    let (player_1_uuid, mut player_1_rx) =
        dummy_player(&mut session, &mut host_rx, "player 1").await;
    let (player_2_uuid, mut player_2_rx) =
        dummy_player(&mut session, &mut host_rx, "player 2").await;
    let (player_3_uuid, mut player_3_rx) =
        dummy_player(&mut session, &mut host_rx, "player 3").await;

    session.status = super::GameSessionStatus::Started;

    session
        .handle_host_cmd(
            Command {
                id: Some(1),
                command: HostCommand::NextQuestion,
            },
            session_arc.clone(),
            code,
        )
        .await
        .unwrap();

    assert!(matches!(
        host_rx.recv().await.unwrap(),
        HostMessage::DisplayQuestion(_)
    ));

    match player_1_rx.recv().await.unwrap() {
        PlayerMessage::DisplayQuestion(question_message)
            if matches!(question_message.options, DisplayQuestionOptions::Slide) => {}
        x => panic!("Invalid message or question type, expected display slide, found: {x:?}"),
    }

    assert!(matches!(
        player_2_rx.recv().await.unwrap(),
        PlayerMessage::DisplayQuestion(_)
    ));
    assert!(matches!(
        player_3_rx.recv().await.unwrap(),
        PlayerMessage::DisplayQuestion(_)
    ));

    let res = session
        .handle_player_cmd(
            Command {
                id: Some(1),
                command: PlayerCommand::AnswerQuestion { answer: Vec::new() },
            },
            session_arc.clone(),
            player_1_uuid,
        )
        .await;
    assert!(matches!(res, Err(GameSessionError::CannotAnswer)));

    session
        .handle_host_cmd(
            Command {
                id: None,
                command: HostCommand::NextQuestion,
            },
            session_arc.clone(),
            code,
        )
        .await
        .unwrap();

    assert!(matches!(
        player_1_rx.recv().await.unwrap(),
        PlayerMessage::QuestionResult { .. }
    ));
    assert!(matches!(
        player_2_rx.recv().await.unwrap(),
        PlayerMessage::QuestionResult { .. }
    ));
    assert!(matches!(
        player_3_rx.recv().await.unwrap(),
        PlayerMessage::QuestionResult { .. }
    ));

    assert!(matches!(
        host_rx.recv().await.unwrap(),
        HostMessage::DisplayLeaderboard { .. }
    ));
    assert!(matches!(
        host_rx.recv().await.unwrap(),
        HostMessage::DisplayQuestion { .. }
    ));

    match player_1_rx.recv().await.unwrap() {
        PlayerMessage::DisplayQuestion(question_message) => match &question_message.options {
            DisplayQuestionOptions::SingleChoice(_) => (),
            x => panic!("Invalid question, expected SingleChoice, found {x:?}"),
        },
        x => panic!("Invalid message, expected DisplayQuestion, found: {x:?}"),
    };

    assert!(matches!(
        player_2_rx.recv().await.unwrap(),
        PlayerMessage::DisplayQuestion(_)
    ));
    assert!(matches!(
        player_3_rx.recv().await.unwrap(),
        PlayerMessage::DisplayQuestion(_)
    ));

    let answers: Vec<Uuid> = session.quiz.clone().unwrap().questions[1]
        .clone()
        .options
        .get_answer_choice_options()
        .iter()
        .map(|x| x.id)
        .collect();

    session
        .handle_player_cmd(
            Command {
                id: Some(1),
                command: PlayerCommand::AnswerQuestion {
                    answer: vec![answers[1]],
                },
            },
            session_arc.clone(),
            player_1_uuid,
        )
        .await
        .unwrap();

    let res = session
        .handle_player_cmd(
            Command {
                id: Some(1),
                command: PlayerCommand::AnswerQuestion {
                    answer: vec![answers[1], answers[2]],
                },
            },
            session_arc.clone(),
            player_2_uuid,
        )
        .await;
    assert!(matches!(res, Err(GameSessionError::InvalidAnswerCount)));

    let res = session
        .handle_player_cmd(
            Command {
                id: Some(1),
                command: PlayerCommand::AnswerQuestion {
                    answer: vec![Uuid::new_v4()],
                },
            },
            session_arc.clone(),
            player_3_uuid,
        )
        .await;
    assert!(matches!(res, Err(GameSessionError::InvalidAnswer)));

    drop(session);

    match host_rx.recv().await.unwrap() {
        HostMessage::ShowStatistics(AnswerStatistics::SingleChoice(stats)) => {
            assert_eq!(stats.answers, 1);
            assert_eq!(stats.answer_statistic.len(), answers.len());
            for (statistic, answer) in stats.answer_statistic.iter().zip(answers) {
                assert_eq!(statistic.option, answer)
            }
        }
        x => panic!("invalid message: {x:?}"),
    }

    match host_rx.recv().await.unwrap() {
        HostMessage::DisplayLeaderboard {
            leaderboard,
            is_final,
        } => {
            if is_final {
                panic!("Shold not be final");
            }

            assert_eq!(leaderboard[0].points, leaderboard[0].total_points);
            assert_eq!(leaderboard[0].points, 1000);
            assert_eq!(leaderboard[1].points, leaderboard[1].total_points);
            assert_eq!(leaderboard[1].points, 0);
            assert_eq!(leaderboard[2].points, leaderboard[2].total_points);
            assert_eq!(leaderboard[2].points, 0);
        }
        x => panic!("invalid message: {x:?}"),
    }

    match player_1_rx.recv().await.unwrap() {
        PlayerMessage::QuestionResult {
            points,
            total_points,
            ..
        } => {
            assert_eq!(points, 1000);
            assert_eq!(total_points, 1000);
        }
        x => panic!("invalid message: {x:?}"),
    }

    match player_2_rx.recv().await.unwrap() {
        PlayerMessage::QuestionResult {
            points,
            total_points,
            ..
        } => {
            assert_eq!(points, 0);
            assert_eq!(total_points, 0);
        }
        x => panic!("invalid message: {x:?}"),
    }

    assert!(matches!(
        player_3_rx.recv().await.unwrap(),
        PlayerMessage::QuestionResult { .. }
    ));

    let mut session = session_arc.lock().await;

    let mut first = true;
    'outer: loop {
        let res = session
            .handle_host_cmd(
                Command {
                    id: None,
                    command: HostCommand::NextQuestion,
                },
                session_arc.clone(),
                code,
            )
            .await;

        if !first {
            for _ in 0..2 {
                match host_rx.recv().await.unwrap() {
                    HostMessage::DisplayLeaderboard { is_final, .. } => {
                        assert!(matches!(
                            player_1_rx.recv().await.unwrap(),
                            PlayerMessage::QuestionResult { .. }
                        ));
                        assert!(matches!(
                            player_2_rx.recv().await.unwrap(),
                            PlayerMessage::QuestionResult { .. }
                        ));
                        assert!(matches!(
                            player_3_rx.recv().await.unwrap(),
                            PlayerMessage::QuestionResult { .. }
                        ));

                        if is_final {
                            assert!(matches!(res, Err(GameSessionError::NoQuestionLeft)));
                            assert!(matches!(
                                player_1_rx.recv().await.unwrap(),
                                PlayerMessage::DisplayLeaderboard { .. }
                            ));
                            assert!(matches!(
                                player_2_rx.recv().await.unwrap(),
                                PlayerMessage::DisplayLeaderboard { .. }
                            ));
                            assert!(matches!(
                                player_3_rx.recv().await.unwrap(),
                                PlayerMessage::DisplayLeaderboard { .. }
                            ));
                            break 'outer;
                        }
                    }
                    HostMessage::ShowStatistics(_) => (),
                    x => panic!("invalid message: {x:?}"),
                }
            }
        }

        match host_rx.recv().await.unwrap() {
            HostMessage::DisplayQuestion(_) => {
                assert!(matches!(
                    player_1_rx.recv().await.unwrap(),
                    PlayerMessage::DisplayQuestion(_)
                ));
                assert!(matches!(
                    player_2_rx.recv().await.unwrap(),
                    PlayerMessage::DisplayQuestion(_)
                ));
                assert!(matches!(
                    player_3_rx.recv().await.unwrap(),
                    PlayerMessage::DisplayQuestion(_)
                ));
            }
            x => panic!("invalid message: {x:?}"),
        }

        res.unwrap();
        first = false;
    }

    session
        .handle_host_cmd(
            Command {
                id: None,
                command: HostCommand::EndGame,
            },
            session_arc.clone(),
            code,
        )
        .await
        .unwrap();

    assert!(matches!(
        player_1_rx.recv().await.unwrap(),
        PlayerMessage::GameEnded
    ));
    assert!(matches!(
        player_2_rx.recv().await.unwrap(),
        PlayerMessage::GameEnded
    ));
    assert!(matches!(
        player_3_rx.recv().await.unwrap(),
        PlayerMessage::GameEnded
    ));
}
