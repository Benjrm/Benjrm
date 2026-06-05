use {
    crate::{
        app_data::TestAppData,
        error::Error,
        game_session::{Channel, ChannelError, GameSessionError, HostMessage, Message},
        quiz::{QuizError, test::create_one},
    },
    std::sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    uuid::Uuid,
};

#[actix_web::test]
async fn create_get_session() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    {
        let (code, _) = data
            .game_sessions
            .create_session(&data.db, &user, None)
            .await
            .unwrap();
        let session = data.game_sessions.get_session(code).await.unwrap();
        let session = session.lock().await;
        assert_eq!(session.host.id, user.id);
        assert!(session.quiz.is_none());
    }

    {
        let quiz = create_one(&data.db, user.id, Some("test quiz".into()), None, false)
            .await
            .unwrap();
        let (code, _) = data
            .game_sessions
            .create_session(&data.db, &user, Some(quiz.id))
            .await
            .unwrap();
        let session = data.game_sessions.get_session(code).await.unwrap();
        let session = session.lock().await;

        assert_eq!(session.host.id, user.id);
        let session_quiz = session.quiz.as_ref().unwrap();
        assert_eq!(session_quiz.model.id, quiz.id);
    }
}

#[actix_web::test]
async fn check_set_host_channel() {
    let data = TestAppData::test().await;
    let user = data.dummy_user().await;

    let closed = Arc::new(AtomicBool::new(false));
    let closed2 = Arc::new(AtomicBool::new(false));
    struct DummyChanel(u64, Arc<AtomicBool>);
    #[async_trait::async_trait]
    impl Channel<HostMessage> for DummyChanel {
        async fn send(&mut self, _msg: Message<HostMessage>) -> Result<(), ChannelError> {
            Ok(())
        }
        async fn close(self: Box<Self>) {
            self.1.store(true, Ordering::Relaxed);
        }
        fn id(&self) -> u64 {
            self.0
        }
    }

    let (_, session) = data
        .game_sessions
        .create_session(&data.db, &user, None)
        .await
        .unwrap();
    let mut session = session.lock().await;

    session.check_set_host_channel(&user).unwrap();
    session
        .set_host_channel(
            &user,
            DummyChanel(DummyChanel::generate_id(), closed.clone()),
        )
        .await
        .unwrap();
    session.check_set_host_channel(&user).unwrap();
    assert!(!closed.load(Ordering::Relaxed));
    session
        .set_host_channel(
            &user,
            DummyChanel(DummyChanel::generate_id(), closed2.clone()),
        )
        .await
        .unwrap();
    assert!(closed.load(Ordering::Relaxed));
    assert!(!closed2.load(Ordering::Relaxed));

    let user2 = data.dummy_user().await;
    assert!(matches!(
        session.check_set_host_channel(&user2),
        Err(GameSessionError::Forbidden)
    ));
    assert!(matches!(
        session
            .set_host_channel(&user2, DummyChanel(DummyChanel::generate_id(), closed))
            .await,
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
        .create_session(&data.db, &user, Some(Uuid::new_v4()))
        .await;
    assert!(matches!(res, Err(Error::Quiz(QuizError::NotFound))));

    let quiz = create_one(&data.db, user.id, Some("test quiz".into()), None, false)
        .await
        .unwrap();
    let res = data
        .game_sessions
        .create_session(&data.db, &user2, Some(quiz.id))
        .await;
    assert!(matches!(res, Err(Error::Quiz(QuizError::Forbidden))));
}
