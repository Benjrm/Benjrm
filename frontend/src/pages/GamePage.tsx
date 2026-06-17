import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import GameScreen from "@/components/GameScreen"
import type {
    GameState,
    GameQuestion,
    QuestionResult,
    LeaderboardEntry,
} from "@/hooks/useGameSession"

export default function GamePage(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const navigate = useNavigate()
    const ws = useWebSocketContext()

    const gameActive = code !== undefined && sessionStorage.getItem(`gameActive:${code}`) === "1"
    useEffect(() => {
        if (!gameActive) {
            navigate(`/play/${codeParam ?? ""}`, { replace: true })
        }
    }, [gameActive, navigate, codeParam])

    const storageKey = code !== undefined ? `waitingRoom:${code}` : null
    const playerName = useMemo(() => {
        if (!storageKey) return undefined
        try {
            const raw = sessionStorage.getItem(storageKey)
            return raw ? (JSON.parse(raw) as { name: string }).name : undefined
        } catch {
            return undefined
        }
    }, [storageKey])

    const [gameState, setGameState] = useState<GameState>("playing")
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [previousLeaderboard, setPreviousLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)

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
        setQuestionResult(null)
    })

    useSocketEvent("questionResult", (payload) => {
        setQuestionResult(payload)
        setGameState("result")
    })

    // handlerRef pattern in useSocketEvent ensures leaderboard/totalQuestions/currentQuestionIndex
    // are always the latest values — no stale closure risk
    useSocketEvent("displayLeaderboard", (payload) => {
        setPreviousLeaderboard(leaderboard)
        setLeaderboard(payload.leaderboard)
        const isLastByIndex = totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1
        setIsFinalLeaderboard(payload.isFinal || isLastByIndex)
        setGameState("leaderboard")
    })

    useSocketEvent("gameEnded", () => {
        if (storageKey) sessionStorage.removeItem(storageKey)
        if (code !== undefined) sessionStorage.removeItem(`gameActive:${code}`)
        navigate("/")
    })

    const sendAnswer = useCallback(
        (answer: string | string[]): void => {
            const answerArray = Array.isArray(answer) ? answer : [answer]
            ws.send({ command: "answerQuestion", payload: { answer: answerArray } })
        },
        [ws]
    )

    return (
        <GameScreen
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            gameState={gameState}
            isFinalLeaderboard={isFinalLeaderboard}
            leaderboard={leaderboard}
            onNextQuestion={() => undefined}
            onSendAnswer={sendAnswer}
            playerName={playerName}
            previousLeaderboard={previousLeaderboard}
            questionExpiresAt={questionExpiresAt}
            questionResult={questionResult}
            totalQuestions={totalQuestions}
        />
    )
}
