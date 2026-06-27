import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import HostGameScreen from "@/components/HostGameScreen"
import { GameStateEnum, parseDisplayQuestion, computeExpiresAt } from "@/hooks/useGameSession"
import type { GameState, GameQuestion, LeaderboardEntry } from "@/hooks/useGameSession"
import type { SessionPlayer } from "@/api/session"

export default function HostDashboard(): JSX.Element {
    const { t } = useTranslation()
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const navigate = useNavigate()
    const location = useLocation()
    const ws = useWebSocketContext()

    const { isLoading: isSessionLoading, isHost } = useSessionStatus(code)
    const { data: quiz } = useSessionQuiz(code)

    const codeWithDash =
        code !== undefined
            ? ((s) => {
                  const mid = Math.floor(s.length / 2)
                  return `${s.slice(0, mid)}-${s.slice(mid)}`
              })(String(code).padStart(8, "0"))
            : undefined

    useEffect(() => {
        if (!isSessionLoading && !isHost) {
            navigate(`/play/${codeParam ?? ""}`, { replace: true })
        }
    }, [isSessionLoading, isHost, navigate, codeParam])

    const [gameState, setGameState] = useState<GameState>(GameStateEnum.PLAYING)
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const [hasPendingFinalPodium, setHasPendingFinalPodium] = useState(false)
    const [players, setPlayers] = useState<SessionPlayer[]>(
        (location.state as { players?: SessionPlayer[] } | null)?.players ?? []
    )

    const hasDisplayedQuestionRef = useRef(false)
    const gameEndedRef = useRef(false)

    const sendEndGame = useCallback((): void => {
        gameEndedRef.current = true
        ws.send({ command: "endGame" })
    }, [ws])

    const sendShowPodium = useCallback((): void => {
        ws.send({ command: "showPodium" })
    }, [ws])

    const showPodium = useCallback((): void => {
        setIsFinalLeaderboard(true)
        setHasPendingFinalPodium(false)
        sendShowPodium()
    }, [sendShowPodium])

    useSocketEvent("displayPodium", () => {
        setIsFinalLeaderboard(true)
        setHasPendingFinalPodium(false)
    })

    useSocketEvent("displayQuestion", (payload, timing) => {
        hasDisplayedQuestionRef.current = true
        setGameState(GameStateEnum.QUESTION)
        setCurrentQuestion(parseDisplayQuestion(payload))
        setQuestionExpiresAt(computeExpiresAt(payload.seconds, timing))
        setTotalQuestions(payload.totalQuestions)
        setCurrentQuestionIndex(payload.index)
    })

    useSocketEvent("displayLeaderboard", (payload) => {
        const isFinal =
            payload.isFinal || (totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1)
        setLeaderboard(payload.leaderboard)
        setGameState(GameStateEnum.LEADERBOARD)
        if (isFinal) {
            if (currentQuestion?.type === "SLIDE") {
                // Slide questions have no result screen — jump straight to podium
                showPodium()
            } else {
                setHasPendingFinalPodium(true)
            }
        } else {
            setIsFinalLeaderboard(false)
            setHasPendingFinalPodium(false)
        }
    })

    useSocketEvent("addPlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => [...prev, { id, name, emoji }])
    })
    useSocketEvent("renamePlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, emoji } : p)))
    })
    useSocketEvent("removePlayer", ({ id }) => {
        const leaving = players.find((p) => p.id === id)
        if (leaving)
            toast(
                `${leaving.emoji ? `${leaving.emoji} ` : ""}${t("game.playerLeft", { name: leaving.name })}`
            )
        setPlayers((prev) => prev.filter((p) => p.id !== id))
    })

    useSocketEvent(
        "error",
        useCallback(
            (payload) => {
                toast.error(payload.message ?? t("game.anErrorOccurred"))
            },
            [t]
        )
    )

    // Send the first question as soon as the WebSocket is ready
    const hasRequestedFirstQuestion = useRef(false)
    useEffect(() => {
        if (hasRequestedFirstQuestion.current) return undefined
        const sendFirstQuestion = (): void => {
            if (hasRequestedFirstQuestion.current) return
            hasRequestedFirstQuestion.current = true
            ws.send({ command: "nextQuestion" })
        }
        return ws.onConnect(sendFirstQuestion)
    }, [ws])

    // Send endGame on unmount only after the first question was received from the server.
    // Guards against React StrictMode's double-mount: the cleanup fires before the server
    // ever sends displayQuestion, so hasDisplayedQuestionRef is still false then.
    useEffect(
        () => () => {
            if (!gameEndedRef.current && hasDisplayedQuestionRef.current) {
                ws.send({ command: "endGame" })
            }
        },
        [ws]
    )

    const sendNextQuestion = useCallback((): void => {
        ws.send({ command: "nextQuestion" })
    }, [ws])

    return (
        <HostGameScreen
            codeWithDash={codeWithDash}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            gameState={gameState}
            isFinalLeaderboard={isFinalLeaderboard}
            leaderboard={leaderboard}
            onEndGame={sendEndGame}
            onNextQuestion={sendNextQuestion}
            onShowPodium={hasPendingFinalPodium ? showPodium : undefined}
            players={players}
            questionExpiresAt={questionExpiresAt}
            quizTitle={quiz?.title}
            totalQuestions={totalQuestions}
        />
    )
}
