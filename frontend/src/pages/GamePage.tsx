import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Toaster, toast } from "sonner"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import { QuestionTypeEnum } from "@/api/questions/types/questionType"
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
        if (gameActive) return
        navigate(`/play/${codeParam ?? ""}`, { replace: true })
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

    // Start as true so the overlay shows until the WS is confirmed open.
    // onEveryConnect fires immediately if the socket is already open (normal navigation),
    // so there is no visible flash on non-refresh transitions.
    const [isReconnecting, setIsReconnecting] = useState(true)
    useEffect(() => {
        const unsubDisconnect = ws.onEveryDisconnect(() => setIsReconnecting(true))
        const unsubConnect = ws.onEveryConnect(() => setIsReconnecting(false))
        return () => {
            unsubDisconnect()
            unsubConnect()
        }
    }, [ws])

    // Lazy initializers read the snapshot once on mount to restore state after a page refresh.
    // sessionStorage reads are synchronous and fast, so calling getGameSnapshot per field is fine.
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.PLAYING)
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const [playerItemOrder, setPlayerItemOrder] = useState<string[] | null>(null)

    useSocketEvent("displayQuestion", (payload, timing) => {
        setPlayerItemOrder(null)
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
        setCurrentQuestionIndex(payload.index)
        setQuestionResult(null)
    })

    useSocketEvent("questionResult", (payload) => {
        if (currentQuestion?.type === QuestionTypeEnum.SLIDE) return
        setQuestionResult(payload)
        setGameState(GameStateEnum.RESULT)
    })

    useSocketEvent("displayLeaderboard", (payload) => {
        setLeaderboard(payload.leaderboard)
        setIsFinalLeaderboard(payload.isFinal)
        setGameState(GameStateEnum.LEADERBOARD)
    })

    const [hostEndedGame, setHostEndedGame] = useState(false)

    useSocketEvent("gameEnded", () => {
        if (storageKey) sessionStorage.removeItem(storageKey)
        if (isFinalLeaderboard) {
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
            {isReconnecting ? (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 text-center backdrop-blur-sm">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                    <p className="text-muted-foreground">Reconnecting…</p>
                </div>
            ) : null}
            <GameScreen
                currentQuestion={currentQuestion}
                currentQuestionIndex={currentQuestionIndex}
                gameState={gameState}
                isFinalLeaderboard={isFinalLeaderboard}
                leaderboard={leaderboard}
                onItemOrderChange={setPlayerItemOrder}
                onNextQuestion={() => undefined}
                onSendAnswer={sendAnswer}
                playerEmoji={playerEmoji}
                playerItemOrder={playerItemOrder}
                playerName={playerName}
                questionExpiresAt={questionExpiresAt}
                questionResult={questionResult}
                totalQuestions={totalQuestions}
            />
        </>
    )
}
