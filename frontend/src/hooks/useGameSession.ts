import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import useSessionPlayers from "@/api/session/hooks/useSessionPlayers"
import type { QuestionType } from "@/api/questions/types/questionType"

export const AVAILABLE_EMOJIS = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😉",
    "😍",
    "🤩",
    "😎",
    "🦁",
    "🦒",
    "🐭",
    "🐶",
    "🐱",
    "🐼",
    "🐸",
    "🦎",
    "🦕",
    "🦖",
    "🦄",
    "🐴",
    "🐳",
    "🐵",
    "🦊",
    "🦉",
    "🌟",
]

export interface Player {
    id: string
    name: string
    emoji: string | null
}

export interface GameQuestion {
    id: string
    type: QuestionType
    text: string
    options: { id: string; text: string }[]
    seconds: number | null
}

export interface QuestionResult {
    correctAnswers: string[]
    points: number
    totalPoints: number
}

export interface LeaderboardEntry {
    id: string
    name: string
    emoji: string | null
    totalPoints: number
    points: number
}

export const GameStateEnum = {
    LOBBY: "lobby",
    PLAYING: "playing",
    QUESTION: "question",
    LEADERBOARD: "leaderboard",
    RESULT: "result",
} as const

export type GameState = (typeof GameStateEnum)[keyof typeof GameStateEnum]

export interface UseGameSessionResult {
    gameState: GameState
    currentQuestion: GameQuestion | null
    currentQuestionIndex: number
    totalQuestions: number
    questionExpiresAt: number | null
    leaderboard: LeaderboardEntry[] | null
    previousLeaderboard: LeaderboardEntry[] | null
    isFinalLeaderboard: boolean
    questionResult: QuestionResult | null
    players: Player[]
    name: string
    setName: (name: string) => void
    emoji: string
    isEmojiOpen: boolean
    setIsEmojiOpen: (open: boolean) => void
    nameSaved: boolean
    nameError: string | null
    pendingId: number | null
    pendingStartId: number | null
    wsConnected: boolean | undefined
    onSaveName: () => void
    onKickPlayer: (playerId: string) => void
    onPickEmoji: (nextEmoji: string) => void
    onStartGame: () => void
    sendNextQuestion: () => void
    sendAnswer: (answer: string | string[]) => void
    sendEndGame: () => void
}

interface UseGameSessionParams {
    code: number | undefined
    wsCode: number | undefined
    isHost: boolean
    isPlayer: boolean
    storageKey: string | null
}

export function useGameSession({
    code,
    wsCode,
    isHost,
    isPlayer,
    storageKey,
}: UseGameSessionParams): UseGameSessionResult {
    const navigate = useNavigate()
    const websocket = useWebSocketContext()

    // Game state machine
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.LOBBY)
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [previousLeaderboard, setPreviousLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null)

    // Live player list seeded from REST on mount
    const { data: initialPlayers } = useSessionPlayers(isHost ? code : undefined)
    const [players, setPlayers] = useState<Player[]>([])
    const playersRef = useRef<Player[]>([])
    useEffect(() => {
        playersRef.current = players
    }, [players])
    const playersInitialized = useRef(false)
    useEffect(() => {
        if (initialPlayers && !playersInitialized.current) {
            playersInitialized.current = true
            setPlayers(initialPlayers)
        }
    }, [initialPlayers])

    // Player identity
    const [name, setName] = useState<string>(() => {
        if (!storageKey) return ""
        try {
            const raw = sessionStorage.getItem(storageKey)
            return raw ? (JSON.parse(raw) as { name: string }).name : ""
        } catch {
            return ""
        }
    })
    const [emoji, setEmoji] = useState<string>(() => {
        const fallback = AVAILABLE_EMOJIS[Math.floor(Math.random() * AVAILABLE_EMOJIS.length)]
        if (!storageKey) return fallback
        try {
            const raw = sessionStorage.getItem(storageKey)
            return raw ? (JSON.parse(raw) as { emoji: string }).emoji : fallback
        } catch {
            return fallback
        }
    })
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const [nameSaved, setNameSaved] = useState(false)
    const [nameError, setNameError] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const [pendingStartId, setPendingStartId] = useState<number | null>(null)
    const [pendingAnswerId, setPendingAnswerId] = useState<number | null>(null)
    const [pendingNextId, setPendingNextId] = useState<number | null>(null)

    // WS connection tracking (player role only)
    const [wsConnectionState, setWsConnectionState] = useState<{
        code: number | undefined
        connected: boolean | undefined
    }>({ code: undefined, connected: undefined })
    const wsConnected = wsConnectionState.code === wsCode ? wsConnectionState.connected : undefined

    useEffect(() => {
        if (!wsCode || !isPlayer) return undefined
        const unsubOpen = websocket.onConnect(() => {
            setWsConnectionState({ code: wsCode, connected: true })
        })
        const unsubFail = websocket.onConnectFail(() => {
            setWsConnectionState({ code: wsCode, connected: false })
        })
        return (): void => {
            unsubOpen()
            unsubFail()
        }
    }, [wsCode, isPlayer, websocket])

    // Re-send name after reconnect so the server keeps recognising the player
    useEffect(() => {
        if (!wsCode || isHost || !storageKey) return undefined
        const savedRaw = sessionStorage.getItem(storageKey)
        if (!savedRaw) return undefined
        let saved: { name: string; emoji: string }
        try {
            saved = JSON.parse(savedRaw) as { name: string; emoji: string }
        } catch {
            return undefined
        }
        const unsub = websocket.onConnect(() => {
            const id = Math.floor(Math.random() * 2 ** 31)
            setPendingId(id)
            websocket.send({
                id,
                command: "setName",
                payload: { name: saved.name, emoji: saved.emoji },
            })
        })
        return (): void => {
            unsub()
        }
    }, [wsCode, isHost, storageKey, websocket])

    // Player list events
    useSocketEvent("addPlayer", ({ id, name: playerName, emoji: playerEmoji }) => {
        setPlayers((prev) => [...prev, { id, name: playerName, emoji: playerEmoji }])
    })
    useSocketEvent("renamePlayer", ({ id, name: playerName, emoji: playerEmoji }) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name: playerName, emoji: playerEmoji } : p))
        )
    })
    useSocketEvent("removePlayer", ({ id }) => {
        if (isHost) {
            const leaving = playersRef.current.find((p) => p.id === id)
            if (leaving) {
                toast(
                    `${leaving.emoji ? `${leaving.emoji} ` : ""}${leaving.name} has left the room`
                )
            }
        }
        setPlayers((prev) => prev.filter((p) => p.id !== id))
    })

    // Game flow events
    useSocketEvent("start", () => {
        setGameState(GameStateEnum.PLAYING)
    })

    useSocketEvent("displayQuestion", (payload, timing) => {
        setGameState(GameStateEnum.QUESTION)
        setCurrentQuestion({
            id: payload.id,
            type: payload.type,
            text: payload.question,
            options: (payload.options || []).map((opt: { id: string; answer: string }) => ({
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
        setGameState(GameStateEnum.RESULT)
    })

    useSocketEvent("displayLeaderboard", (payload) => {
        setPreviousLeaderboard(leaderboard)
        setLeaderboard(payload.leaderboard)
        const isLastByIndex = totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1
        setIsFinalLeaderboard(payload.isFinal || isLastByIndex)
        setGameState(GameStateEnum.LEADERBOARD)
    })

    useSocketEvent("kick", () => {
        if (storageKey) sessionStorage.removeItem(storageKey)
        toast.error("You have been removed from the lobby by the host.")
        setTimeout(async () => {
            try {
                await navigate("/")
            } catch {
                // ignore navigation errors
            }
        }, 2000)
    })

    useSocketEvent("gameEnded", () => {
        if (storageKey) sessionStorage.removeItem(storageKey)
        navigate("/")
    })

    useSocketEvent("ok", (_payload, _timing, id) => {
        if (pendingId === id) {
            setPendingId(null)
            setNameSaved(true)
        } else if (pendingStartId === id) {
            setPendingStartId(null)
            setGameState(GameStateEnum.PLAYING)
            if (isHost) {
                websocket.send({ command: "nextQuestion" })
            }
        }
    })

    useSocketEvent("error", (payload, _timing, id) => {
        if (pendingId === id) {
            setPendingId(null)
            setNameError(payload.message)
        } else if (pendingStartId === id) {
            setPendingStartId(null)
            toast.error(payload.message || "Failed to start the game")
        } else if (pendingAnswerId === id) {
            setPendingAnswerId(null)
            toast.error(payload.message || "Your answer could not be submitted")
        } else if (pendingNextId === id) {
            setPendingNextId(null)
            toast.error(payload.message || "Could not advance to the next question")
        } else if (gameState !== GameStateEnum.LOBBY) {
            toast.error(payload.message || "Something went wrong")
        }
    })

    // Actions
    function onSaveName(): void {
        const trimmed = name.trim()
        if (!trimmed) return
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingId(id)
        setNameError(null)
        websocket.send({ id, command: "setName", payload: { name: trimmed, emoji } })
        if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify({ name: trimmed, emoji }))
    }

    function onKickPlayer(playerId: string): void {
        websocket.send({ command: "kickPlayer", payload: { id: playerId } })
    }

    function onPickEmoji(nextEmoji: string): void {
        setEmoji(nextEmoji)
        setIsEmojiOpen(false)
    }

    const onStartGame = useCallback((): void => {
        if (players.length === 0) {
            toast.error("Waiting for players to join...")
            return
        }
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingStartId(id)
        websocket.send({ id, command: "start" })
    }, [players.length, websocket])

    function sendNextQuestion(): void {
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingNextId(id)
        websocket.send({ id, command: "nextQuestion" })
    }

    function sendAnswer(answer: string | string[]): void {
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingAnswerId(id)
        const answerArray = Array.isArray(answer) ? answer : [answer]
        websocket.send({ id, command: "answerQuestion", payload: { answer: answerArray } })
    }

    function sendEndGame(): void {
        websocket.send({ command: "endGame" })
    }

    return {
        gameState,
        currentQuestion,
        currentQuestionIndex,
        totalQuestions,
        questionExpiresAt,
        leaderboard,
        previousLeaderboard,
        isFinalLeaderboard,
        questionResult,
        players,
        name,
        setName,
        emoji,
        isEmojiOpen,
        setIsEmojiOpen,
        nameSaved,
        nameError,
        pendingId,
        pendingStartId,
        wsConnected,
        onSaveName,
        onKickPlayer,
        onPickEmoji,
        onStartGame,
        sendNextQuestion,
        sendAnswer,
        sendEndGame,
    }
}
