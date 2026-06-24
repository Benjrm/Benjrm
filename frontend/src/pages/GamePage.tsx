import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Toaster, toast } from "sonner"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import GameScreen from "@/components/GameScreen"
import { GameStateEnum } from "@/hooks/useGameSession"
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
    const { playerName, playerEmoji } = useMemo(() => {
        if (!storageKey) return { playerName: undefined, playerEmoji: undefined }
        try {
            const raw = sessionStorage.getItem(storageKey)
            const parsed = raw ? (JSON.parse(raw) as { name: string; emoji: string }) : null
            return { playerName: parsed?.name, playerEmoji: parsed?.emoji }
        } catch {
            return { playerName: undefined, playerEmoji: undefined }
        }
    }, [storageKey])

    const [gameState, setGameState] = useState<GameState>(GameStateEnum.PLAYING)
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const pendingFinalLeaderboardRef = useRef<LeaderboardEntry[] | null>(null)

    useSocketEvent("displayQuestion", (payload, timing) => {
        setGameState(GameStateEnum.QUESTION)
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
        if (currentQuestion?.type === "SLIDE") return
        setQuestionResult(payload)
        setGameState(GameStateEnum.RESULT)
    })

    useSocketEvent("displayLeaderboard", (payload) => {
        if (payload.isFinal) {
            // Buffer final leaderboard — player stays on result screen until host ends the game
            pendingFinalLeaderboardRef.current = payload.leaderboard
            setIsFinalLeaderboard(true)
        } else {
            setLeaderboard(payload.leaderboard)
            setIsFinalLeaderboard(false)
            setGameState(GameStateEnum.LEADERBOARD)
        }
    })

    const [hostEndedGame, setHostEndedGame] = useState(false)

    useSocketEvent("gameEnded", () => {
        if (storageKey) sessionStorage.removeItem(storageKey)
        const pending = pendingFinalLeaderboardRef.current
        if (pending) {
            // First signal: show the final podium. Clear buffer so the next gameEnded navigates away.
            pendingFinalLeaderboardRef.current = null
            setLeaderboard(pending)
            setIsFinalLeaderboard(true)
            setGameState(GameStateEnum.LEADERBOARD)
        } else if (isFinalLeaderboard) {
            // Second signal: host ended the game after players saw the podium — navigate away cleanly
            if (code !== undefined) sessionStorage.removeItem(`gameActive:${code}`)
            navigate("/")
        } else {
            // Host ended game early (before last question finished)
            if (code !== undefined) sessionStorage.removeItem(`gameActive:${code}`)
            setHostEndedGame(true)
        }
    })

    useEffect(() => {
        if (!hostEndedGame) return undefined
        toast.error("Host has closed the lobby")
        const t = setTimeout(() => {
            if (code !== undefined) sessionStorage.removeItem(`gameActive:${code}`)
            navigate("/")
        }, 3000)
        return () => clearTimeout(t)
    }, [hostEndedGame, navigate, code])

    const sendAnswer = useCallback(
        (answer: string | string[]): void => {
            const answerArray = Array.isArray(answer) ? answer : [answer]
            ws.send({ command: "answerQuestion", payload: { answer: answerArray } })
        },
        [ws]
    )

    if (hostEndedGame) {
        return (
            <>
                <Toaster richColors />
                <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                    <p className="text-muted-foreground">Host has closed the lobby...</p>
                </div>
            </>
        )
    }

    return (
        <>
            <Toaster richColors />
            <GameScreen
                currentQuestion={currentQuestion}
                currentQuestionIndex={currentQuestionIndex}
                gameState={gameState}
                isFinalLeaderboard={isFinalLeaderboard}
                leaderboard={leaderboard}
                onNextQuestion={() => undefined}
                onSendAnswer={sendAnswer}
                playerEmoji={playerEmoji}
                playerName={playerName}
                questionExpiresAt={questionExpiresAt}
                questionResult={questionResult}
                totalQuestions={totalQuestions}
            />
        </>
    )
}
