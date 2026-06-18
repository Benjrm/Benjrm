// frontend/src/pages/WaitingRoom.tsx

import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import GamePinForm from "@/components/GamePinForm"
import Lobby from "@/components/Lobby"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import useSessionPlayers from "@/api/session/hooks/useSessionPlayers"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import { AVAILABLE_EMOJIS } from "@/hooks/useGameSession"
import type { Player } from "@/hooks/useGameSession"

export default function WaitingRoom(): JSX.Element {
    const navigate = useNavigate()
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const codeWithDash =
        code !== undefined
            ? ((s) => {
                  const mid = Math.floor(s.length / 2)
                  return `${s.slice(0, mid)}-${s.slice(mid)}`
              })(String(code).padStart(8, "0"))
            : undefined

    const { isLoading: isLoadingSession, isHost, isPlayer, isInvalidCode } = useSessionStatus(code)
    const { data: quiz, isLoading: isLoadingQuiz } = useSessionQuiz(isHost ? code : undefined)
    const { data: initialPlayers } = useSessionPlayers(isHost ? code : undefined)

    const ws = useWebSocketContext()

    const storageKey = code !== undefined ? `waitingRoom:${code}` : null

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

    // Player list (used by host to display joined players)
    const [players, setPlayers] = useState<Player[]>([])
    const playersInitialized = useRef(false)
    useEffect(() => {
        if (initialPlayers && !playersInitialized.current) {
            playersInitialized.current = true
            setPlayers(initialPlayers)
        }
    }, [initialPlayers])

    // WS connection tracking (player role only — determines when lobby is ready to show)
    const [wsConnected, setWsConnected] = useState<boolean | undefined>(undefined)
    useEffect(() => {
        if (!isPlayer) return undefined
        const unsubOpen = ws.onConnect(() => setWsConnected(true))
        const unsubFail = ws.onConnectFail(() => setWsConnected(false))
        return (): void => {
            unsubOpen()
            unsubFail()
        }
    }, [isPlayer, ws])

    // Re-send saved name after WS reconnects
    const nameSavedRef = useRef(nameSaved)
    useEffect(() => {
        nameSavedRef.current = nameSaved
    }, [nameSaved])
    useEffect(() => {
        if (!storageKey || isHost) return undefined
        const unsub = ws.onConnect((): void => {
            if (!nameSavedRef.current) return
            const savedRaw = sessionStorage.getItem(storageKey)
            if (!savedRaw) return
            try {
                const saved = JSON.parse(savedRaw) as { name: string; emoji: string }
                ws.send({ command: "setName", payload: { name: saved.name, emoji: saved.emoji } })
            } catch {
                // ignore malformed sessionStorage data
            }
        })
        return unsub
    }, [storageKey, isHost, ws])

    // Player list socket events
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
            const leaving = players.find((p) => p.id === id)
            if (leaving) {
                toast(
                    `${leaving.emoji ? `${leaving.emoji} ` : ""}${leaving.name} has left the room`
                )
            }
        }
        setPlayers((prev) => prev.filter((p) => p.id !== id))
    })

    // Game started: players navigate to game page
    useSocketEvent("start", () => {
        if (!isPlayer) return
        if (code !== undefined) sessionStorage.setItem(`gameActive:${code}`, "1")
        navigate(`/play/${codeParam ?? ""}/game`)
    })

    // Server acknowledgements
    useSocketEvent("ok", (_payload, _timing, id) => {
        if (id === pendingId) {
            setPendingId(null)
            setNameSaved(true)
        } else if (id === pendingStartId) {
            setPendingStartId(null)
            navigate(`/play/${codeParam ?? ""}/host`, {
                state: { players },
            })
        }
    })

    useSocketEvent("error", (payload, _timing, id) => {
        if (id === pendingId) {
            setPendingId(null)
            setNameError(payload.message)
        } else if (id === pendingStartId) {
            setPendingStartId(null)
            toast.error(payload.message || "Failed to start the game")
        } else {
            toast.error(payload.message || "Something went wrong")
        }
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

    // Actions
    const onSaveName = useCallback((): void => {
        const trimmed = name.trim()
        if (!trimmed) return
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingId(id)
        setNameError(null)
        ws.send({ id, command: "setName", payload: { name: trimmed, emoji } })
        if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify({ name: trimmed, emoji }))
    }, [name, emoji, storageKey, ws])

    const onKickPlayer = useCallback(
        (playerId: string): void => {
            ws.send({ command: "kickPlayer", payload: { id: playerId } })
        },
        [ws]
    )

    const onPickEmoji = useCallback((nextEmoji: string): void => {
        setEmoji(nextEmoji)
        setIsEmojiOpen(false)
    }, [])

    const onStartGame = useCallback((): void => {
        if (players.length === 0) {
            toast.error("Waiting for players to join...")
            return
        }
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingStartId(id)
        ws.send({ id, command: "start" })
    }, [players.length, ws])

    if (isLoadingSession || isLoadingQuiz || (isPlayer && wsConnected === undefined)) {
        return (
            <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                <p className="text-muted-foreground text-sm">Loading the quiz lobby…</p>
            </section>
        )
    }

    if (isInvalidCode || !code || (isPlayer && wsConnected === false)) {
        return (
            <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6 py-24">
                <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-500">
                    <h1 className="text-base font-bold">Quiz lobby not found</h1>
                    <p className="mt-1 text-sm">
                        No lobby with the code{" "}
                        <span className="font-mono font-bold">{codeWithDash}</span> was found.
                        Please check the invitation code and try again.
                    </p>
                </div>
                <GamePinForm
                    onJoin={(digits) => {
                        navigate(`/play/${encodeURIComponent(digits)}`)
                    }}
                />
            </section>
        )
    }

    return (
        <Lobby
            codeWithDash={codeWithDash}
            emoji={emoji}
            isEmojiOpen={isEmojiOpen}
            isHost={isHost}
            name={name}
            nameError={nameError}
            nameSaved={nameSaved}
            onCloseEmoji={setIsEmojiOpen}
            onKickPlayer={onKickPlayer}
            onNameChange={setName}
            onOpenEmoji={() => setIsEmojiOpen(true)}
            onPickEmoji={onPickEmoji}
            onSaveName={onSaveName}
            onStartGame={onStartGame}
            pendingId={pendingId}
            pendingStartId={pendingStartId}
            players={players}
            quiz={quiz}
        />
    )
}
