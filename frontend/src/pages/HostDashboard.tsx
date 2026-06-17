import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import HostGameScreen from "@/components/HostGameScreen"
import type { GameState, GameQuestion, LeaderboardEntry } from "@/hooks/useGameSession"
import type { SessionPlayer } from "@/api/session"

export default function HostDashboard(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const navigate = useNavigate()
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

    const [gameState, setGameState] = useState<GameState>("playing")
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const [players, setPlayers] = useState<SessionPlayer[]>([])

    useSocketEvent("displayQuestion", (payload, timing) => {
        setGameState("question")
        setCurrentQuestion({
            id: payload.id,
            type: payload.type,
            text: payload.question,
            options: (payload.options ?? []).map((opt: { id: string; answer: string }) => ({
                id: opt.id,
                text: opt.answer,
            })),
            seconds: payload.seconds ?? null,
        })
        const startedAt = timing ? new Date(timing).getTime() : Date.now()
        setQuestionExpiresAt(payload.seconds ? startedAt + payload.seconds * 1000 : null)
        setTotalQuestions(payload.totalQuestions)
        setCurrentQuestionIndex((prev) => prev + 1)
    })

    // handlerRef pattern ensures totalQuestions/currentQuestionIndex are always fresh
    useSocketEvent("displayLeaderboard", (payload) => {
        setLeaderboard(payload.leaderboard)
        const isLastByIndex = totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1
        setIsFinalLeaderboard(payload.isFinal || isLastByIndex)
        setGameState("leaderboard")
    })

    useSocketEvent("addPlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => [...prev, { id, name, emoji }])
    })
    useSocketEvent("renamePlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, emoji } : p)))
    })
    useSocketEvent("removePlayer", ({ id }) => {
        const leaving = players.find((p) => p.id === id)
        if (leaving) toast(`${leaving.emoji ? `${leaving.emoji} ` : ""}${leaving.name} has left`)
        setPlayers((prev) => prev.filter((p) => p.id !== id))
    })

    useSocketEvent("gameEnded", () => {
        navigate("/")
    })

    useSocketEvent(
        "error",
        useCallback((payload) => {
            toast.error(payload.message ?? "An error occurred")
        }, [])
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

    const sendNextQuestion = useCallback((): void => {
        ws.send({ command: "nextQuestion" })
    }, [ws])

    const sendEndGame = useCallback((): void => {
        ws.send({ command: "endGame" })
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
            players={players}
            questionExpiresAt={questionExpiresAt}
            quizTitle={quiz?.title}
            totalQuestions={totalQuestions}
        />
    )
}
