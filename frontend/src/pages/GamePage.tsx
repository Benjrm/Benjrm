import type { JSX } from "react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Toaster, toast } from "sonner"
import { useTranslation } from "react-i18next"
import { usePlayerWebSocket, useSocketEvent, useWebSocketContext } from "@/api/websocket"
import GameScreen from "@/components/GameScreen"
import { AVAILABLE_EMOJIS, GameStateEnum, parseDisplayQuestion } from "@/hooks/useGameSession"
import type {
    GameState,
    GameQuestion,
    QuestionResult,
    LeaderboardEntry,
} from "@/hooks/useGameSession"
import PlayerLobby from "@/components/PlayerLobby"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import InvalidCode from "@/components/InvalidCode"
import useWebSocketConnectError from "@/api/websocket/hooks/useWebSocketConnectError"

function mergeStorage(key: string, patch: object): void {
    try {
        const raw = sessionStorage.getItem(key)
        const existing = raw ? (JSON.parse(raw) as object) : {}
        sessionStorage.setItem(key, JSON.stringify({ ...existing, ...patch }))
    } catch {
        /* ignore */
    }
}

function GamePageComponent({ code }: { code?: number }): JSX.Element {
    const { t } = useTranslation()
    const navigate = useNavigate()
    usePlayerWebSocket(code)
    const ws = useWebSocketContext()
    const { session } = useSessionStatus(code)

    const codeWithDash =
        code !== undefined
            ? ((s) => {
                  const mid = Math.floor(s.length / 2)
                  return `${s.slice(0, mid)}-${s.slice(mid)}`
              })(String(code).padStart(8, "0"))
            : undefined

    const storageKey = code !== undefined ? `waitingRoom:${code}` : null

    const { isReconnecting, isInvalidCode, unableToConnect } = useWebSocketConnectError(ws, code)

    // Player identity
    const [name, setName] = useState<string>("")
    const [emoji, setEmoji] = useState<string>(
        () => AVAILABLE_EMOJIS[Math.floor(Math.random() * AVAILABLE_EMOJIS.length)]
    )
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const [nameSaved, setNameSaved] = useState(() => {
        if (!storageKey) return false
        try {
            const raw = sessionStorage.getItem(storageKey)
            return raw ? (JSON.parse(raw) as { nameSaved: boolean }).nameSaved : false
        } catch {
            return false
        }
    })
    const [nameError, setNameError] = useState<string | null>(null)
    const [saveNameId, setSaveNameId] = useState<number | null>(null)

    // Persist player credentials for reconnect
    useSocketEvent(
        "connectResponse",
        ({ id: playerId, secret, name: serverName, emoji: serverEmoji }) => {
            if (!storageKey) return
            try {
                const existing = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}")
                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify({ ...existing, id: playerId, secret })
                )
            } catch {
                // ignore
            }
            // connectResponse confirms the player is in the session (initial join or reconnect).
            // Restore lobby state so a refresh doesn't show the join form again.
            setNameSaved(true)
            setName(serverName)
            if (serverEmoji) setEmoji(serverEmoji)
        }
    )

    const [isAlreadyStarted, setIsAlreadyStarted] = useState(false)
    useEffect(() => {
        if (session?.started) {
            if (storageKey) {
                try {
                    const raw = sessionStorage.getItem(storageKey)
                    const id = raw ? (JSON.parse(raw) as { id: string }).id : null
                    // skip error handling for started session if we have an id
                    if (id) return undefined
                } catch {
                    // not returning here is enough to trigger the error handling below
                }
            }
            const id = setTimeout(() => setIsAlreadyStarted(true))
            return () => clearTimeout(id)
        }
        return undefined
    }, [session, storageKey])

    useSocketEvent("ok", (_payload, _timing, id) => {
        if (id === saveNameId) {
            setSaveNameId(null)
            setNameSaved(true)
            if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify({ nameSaved: true }))
        }
    })

    useSocketEvent("error", (payload, _timing, id) => {
        if (id === saveNameId) {
            setSaveNameId(null)
            setNameError(payload.message)
        } else {
            toast.error(payload.message || t("lobby.errors.somethingWentWrong"))
        }
    })

    useSocketEvent("kick", () => {
        if (storageKey) sessionStorage.removeItem(storageKey)
        toast.error(t("lobby.errors.kicked"))
        setTimeout(async () => {
            try {
                await navigate("/")
            } catch {
                // ignore navigation errors
            }
        }, 2000)
    })

    const onSaveName = useCallback((): void => {
        const trimmed = name.trim()
        if (!trimmed) return
        const id = Math.floor(Math.random() * 2 ** 31)
        setSaveNameId(id)
        setNameError(null)
        ws.send({ id, command: "setName", payload: { name: trimmed, emoji } })
    }, [name, emoji, ws])

    const onPickEmoji = useCallback((nextEmoji: string): void => {
        setEmoji(nextEmoji)
        setIsEmojiOpen(false)
    }, [])

    // Lazy initializers read the snapshot once on mount to restore state after a page refresh.
    // sessionStorage reads are synchronous and fast, so calling getGameSnapshot per field is fine.
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.LOBBY)
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

    useSocketEvent("start", () => {
        setGameState(GameStateEnum.PLAYING)
    })

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
            navigate("/")
        } else {
            // Host ended game early (before last question finished)
            setHostEndedGame(true)
        }
    })

    useEffect(() => {
        if (!hostEndedGame) return undefined
        toast.error(t("game.hostClosed"))
        const timer = setTimeout(() => {
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

    if (isInvalidCode || isAlreadyStarted || unableToConnect) {
        return (
            <InvalidCode
                alreadyStarted={isAlreadyStarted}
                codeWithDash={codeWithDash}
                unableToConnect={unableToConnect}
            />
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
            {gameState === GameStateEnum.LOBBY ? (
                <PlayerLobby
                    codeWithDash={codeWithDash}
                    emoji={emoji}
                    isEmojiOpen={isEmojiOpen}
                    name={name}
                    nameError={nameError}
                    namePending={saveNameId !== null}
                    nameSaved={nameSaved}
                    onCloseEmoji={setIsEmojiOpen}
                    onNameChange={setName}
                    onOpenEmoji={() => setIsEmojiOpen(true)}
                    onPickEmoji={onPickEmoji}
                    onSaveName={onSaveName}
                />
            ) : (
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
                    playerEmoji={emoji}
                    playerItemOrder={playerItemOrder}
                    playerName={name}
                    questionExpiresAt={questionExpiresAt}
                    questionResult={questionResult}
                    questionStartsAt={questionStartsAt}
                    totalQuestions={totalQuestions}
                />
            )}
        </>
    )
}

export default function GamePage(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    return <GamePageComponent key={code} code={code} />
}
