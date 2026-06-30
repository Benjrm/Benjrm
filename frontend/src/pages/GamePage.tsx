import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Toaster, toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import GameScreen from "@/components/GameScreen"
import { GameStateEnum, parseDisplayQuestion } from "@/hooks/useGameSession"
import type {
    GameState,
    GameQuestion,
    QuestionResult,
    LeaderboardEntry,
} from "@/hooks/useGameSession"

function mergeStorage(key: string, patch: object): void {
    try {
        const raw = sessionStorage.getItem(key)
        const existing = raw ? (JSON.parse(raw) as object) : {}
        sessionStorage.setItem(key, JSON.stringify({ ...existing, ...patch }))
    } catch {
        /* ignore */
    }
}

export default function GamePage(): JSX.Element {
    const { t } = useTranslation()
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
        const unsubConnectFail = ws.onConnectFail(async () => navigate("/"))
        return () => {
            unsubDisconnect()
            unsubConnect()
            unsubConnectFail()
        }
    }, [ws, navigate])

    // Lazy initializers read the snapshot once on mount to restore state after a page refresh.
    // sessionStorage reads are synchronous and fast, so calling getGameSnapshot per field is fine.
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.PLAYING)
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [questionStartsAt, setQuestionStartsAt] = useState<number | null>(null)
    const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const [playerItemOrder, setPlayerItemOrder] = useState<string[] | null>(null)
    const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false)
    const [initialSelectedAnswers, setInitialSelectedAnswers] = useState<string[]>([])

    useSocketEvent("displayQuestion", (payload, timing) => {
        let isReconnect = false
        let alreadySubmitted = false
        let restoredAnswers: string[] = []
        let restoredItemOrder: string[] | null = null

        if (storageKey) {
            try {
                const raw = sessionStorage.getItem(storageKey)
                const stored = raw
                    ? (JSON.parse(raw) as {
                          lastQuestionId?: string
                          submittedQuestionId?: string
                          submittedAnswers?: string[]
                          currentItemOrder?: string[]
                      })
                    : {}
                isReconnect = stored.lastQuestionId === payload.id
                alreadySubmitted = stored.submittedQuestionId === payload.id
                restoredAnswers = alreadySubmitted ? (stored.submittedAnswers ?? []) : []
                if (isReconnect) {
                    restoredItemOrder = alreadySubmitted
                        ? restoredAnswers
                        : (stored.currentItemOrder ?? null)
                }
                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify({ ...stored, lastQuestionId: payload.id })
                )
            } catch {
                /* ignore */
            }
        }

        setHasSubmittedAnswer(alreadySubmitted)
        setInitialSelectedAnswers(restoredAnswers)
        setPlayerItemOrder(restoredItemOrder)
        setGameState(GameStateEnum.QUESTION)
        setCurrentQuestion(parseDisplayQuestion(payload))
        const startsAt = timing ? new Date(timing).getTime() : Date.now()
        setQuestionStartsAt(startsAt)
        setQuestionExpiresAt(payload.seconds ? startsAt + payload.seconds * 1000 : null)
        setTotalQuestions(payload.totalQuestions)
        setCurrentQuestionIndex(payload.index)
        setQuestionResult(null)
    })

    useSocketEvent("questionResult", (payload) => {
        if (currentQuestion?.type === "SLIDE") return
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
        toast.error(t("game.hostClosed"))
        const timer = setTimeout(() => {
            if (code !== undefined) sessionStorage.removeItem(`gameActive:${code}`)
            navigate("/")
        }, 3000)
        return () => clearTimeout(timer)
    }, [hostEndedGame, navigate, code, t])

    const sendAnswer = useCallback(
        (answer: string | string[]): void => {
            const answerArray = Array.isArray(answer) ? answer : [answer]
            ws.send({ command: "answerQuestion", payload: { answer: answerArray } })
            setHasSubmittedAnswer(true)
            if (storageKey && currentQuestion) {
                mergeStorage(storageKey, {
                    submittedQuestionId: currentQuestion.id,
                    submittedAnswers: answerArray,
                })
            }
        },
        [ws, storageKey, currentQuestion]
    )

    const handleItemOrderChange = useCallback(
        (ids: string[]): void => {
            setPlayerItemOrder(ids)
            if (storageKey) {
                mergeStorage(storageKey, { currentItemOrder: ids })
            }
        },
        [storageKey]
    )

    if (hostEndedGame) {
        return (
            <>
                <Toaster richColors />
                <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                    <p className="text-muted-foreground">{t("game.hostClosedLoading")}</p>
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
                    <p className="text-muted-foreground">{t("game.reconnecting")}</p>
                </div>
            ) : null}
            <GameScreen
                currentQuestion={currentQuestion}
                currentQuestionIndex={currentQuestionIndex}
                gameState={gameState}
                hasSubmittedAnswer={hasSubmittedAnswer}
                initialSelectedAnswers={initialSelectedAnswers}
                isFinalLeaderboard={isFinalLeaderboard}
                leaderboard={leaderboard}
                onItemOrderChange={handleItemOrderChange}
                onNextQuestion={() => undefined}
                onSendAnswer={sendAnswer}
                playerEmoji={playerEmoji}
                playerItemOrder={playerItemOrder}
                playerName={playerName}
                questionExpiresAt={questionExpiresAt}
                questionResult={questionResult}
                questionStartsAt={questionStartsAt}
                totalQuestions={totalQuestions}
            />
        </>
    )
}
