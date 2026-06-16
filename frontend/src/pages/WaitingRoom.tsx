// frontend/src/pages/WaitingRoom.tsx

import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { X } from "lucide-react"
import { Toaster, toast } from "sonner"
import ProfilePicker from "../components/ProfilePicker"
import GamePinForm from "@/components/GamePinForm"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import useSessionPlayers from "@/api/session/hooks/useSessionPlayers"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import { Button } from "@/shadcn/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"
import StartQuizButton from "@/components/StartQuizButton.tsx"

interface Player {
    id: string
    name: string
    emoji: string | null
}

const AVAILABLE_EMOJIS = [
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

export default function WaitingRoom(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const codeWithDash =
        code !== undefined
            ? ((s) => {
                  const mid = Math.floor(s.length / 2)
                  return `${s.slice(0, mid)}-${s.slice(mid)}`
              })(String(code))
            : undefined

    const { isLoading: isLoadingSession, isHost, isPlayer, isInvalidCode } = useSessionStatus(code)
    const { data: quiz, isLoading: isLoadingQuiz } = useSessionQuiz(isHost ? code : undefined)
    const { data: initialPlayers } = useSessionPlayers(isHost ? code : undefined)

    // Delay WS connection until role is determined
    // (which would disconnect mid-render and wipe all event subscriptions via listeners.clear())
    // WS connection is managed by PlayLayout; wsCode is only used for tracking connection state.
    const wsCode = isLoadingSession ? undefined : code

    const websocket = useWebSocketContext()

    // Live player list — seeded from the REST endpoint on mount so state survives a reload
    const [players, setPlayers] = useState<Player[]>([])
    const playersInitialized = useRef(false)
    useEffect(() => {
        if (initialPlayers && !playersInitialized.current) {
            playersInitialized.current = true
            setPlayers(initialPlayers)
        }
    }, [initialPlayers])

    useSocketEvent("addPlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => [...prev, { id, name, emoji }])
    })
    useSocketEvent("renamePlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, emoji } : p)))
    })
    useSocketEvent("removePlayer", ({ id }) => {
        setPlayers((prev) => prev.filter((p) => p.id !== id))
    })

    // sessionStorage key scoped to this session code.
    const storageKey = code !== undefined ? `waitingRoom:${code}` : null

    // Player name-setting state — lazy initialisers read from sessionStorage so a reload
    // restores the pre-filled form without calling setState inside an effect.
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

    // Once the WebSocket is open, automatically re-send setName so the server
    // recognises the player without them having to type their name again.
    // Reads directly from sessionStorage inside the effect to avoid ref-during-render.
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

    // Track the player WS connection outcome so we can show "not found" when an unauthenticated
    // user enters an invalid code (the REST endpoint always returns 401 for unauthenticated users
    // regardless of code validity, so WS is the only reliable check).
    // Storing the code alongside the result lets the derived value reset to `undefined` automatically
    // when wsCode changes, without a synchronous setState inside the effect body.
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

    const navigate = useNavigate()
    const [pendingStartId, setPendingStartId] = useState<number | null>(null)

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

    useSocketEvent("start", () => {
        if (code && !isHost) {
            navigate(`/play/${code}/game`)
        }
    })

    useSocketEvent("ok", (_payload, _timing, id) => {
        if (pendingId === id) {
            setPendingId(null)
            setNameSaved(true)
        }
        if (pendingStartId === id && code) {
            setPendingStartId(null)
            navigate(`/play/${code}/host`, {
                state: { playerCount: players.length },
            })
        }
    })

    useSocketEvent("error", (payload, _timing, id) => {
        if (pendingId === id) {
            setPendingId(null)
            setNameError(payload.message)
        }
        if (pendingStartId === id) {
            setPendingStartId(null)
            toast.error(payload.message ?? "Failed to start the quiz.")
        }
    })

    function onSaveName(): void {
        const trimmed = name.trim()
        if (!trimmed) return
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingId(id)
        setNameError(null)
        websocket.send({ id, command: "setName", payload: { name: trimmed, emoji } })
        if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify({ name: trimmed, emoji }))
    }

    const handleStartQuiz = useCallback(() => {
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingStartId(id)
        websocket.send({ id, command: "start" })
    }, [websocket])

    function onKickPlayer(playerId: string): void {
        websocket.send({ command: "kickPlayer", payload: { id: playerId } })
    }

    function onPickEmoji(nextEmoji: string): void {
        setEmoji(nextEmoji)
        setIsEmojiOpen(false)
    }

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
        <section className="mx-auto w-full max-w-4xl py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    Waiting Lobby
                </div>
                <p className="text-muted-foreground text-sm">
                    Game Pin: {codeWithDash ?? "No active PIN"}
                </p>
            </div>

            <div className="dark:text-foreground overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111318]">
                <div className="bg-linear-to-r from-[#00D4E8]/10 via-transparent to-[#FF8A00]/10 p-6 sm:p-8">
                    {isHost ? (
                        <>
                            <div className="mb-4">
                                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                                    {quiz?.title ?? "No title"}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Players joined:{" "}
                                    <span className="text-foreground font-semibold">
                                        {players.length}
                                    </span>
                                </p>
                            </div>

                            <ul className="space-y-2">
                                {players.map((player) => (
                                    <li
                                        key={player.id}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 dark:bg-black/20"
                                    >
                                        <div className="bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase">
                                            {player.emoji ?? player.name.charAt(0)}
                                        </div>
                                        <p className="flex-1 text-sm font-medium">{player.name}</p>
                                        <Button
                                            className="h-7 w-7 text-white/50 hover:text-red-400"
                                            onClick={() => onKickPlayer(player.id)}
                                            size="icon"
                                            title={`Kick ${player.name}`}
                                            type="button"
                                            variant="ghost"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}

                                {players.length === 0 ? (
                                    <li className="text-muted-foreground py-4 text-center text-sm">
                                        No players yet — share the pin!
                                    </li>
                                ) : null}
                            </ul>
                        </>
                    ) : (
                        <div className="mb-5 rounded-xl border border-white/10 bg-black/10 p-4 dark:bg-black/20">
                            {nameSaved ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00D4E8]/20 text-xl">
                                        {emoji}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            You&apos;re in!.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-sm font-semibold tracking-wide">
                                            Player Setup
                                        </p>
                                        <span className="text-muted-foreground text-xs">
                                            Tap avatar to choose emoji
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                        <ProfilePicker
                                            emoji={emoji}
                                            name={name}
                                            nameError={nameError}
                                            onNameChange={setName}
                                            onOpenEmoji={() => setIsEmojiOpen(true)}
                                            onSaveName={() => onSaveName()}
                                            pending={pendingId != null}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-center border-t border-white/10 pt-6">
                        {isHost ? (
                            <StartQuizButton
                                disabled={players.length === 0 || pendingStartId !== null}
                                onStartQuiz={handleStartQuiz}
                            />
                        ) : null}
                        {!isHost && nameSaved ? (
                            <p className="text-muted-foreground text-sm font-medium">
                                Waiting for host to start the game
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            <Toaster richColors />

            <Dialog onOpenChange={setIsEmojiOpen} open={isEmojiOpen}>
                <DialogContent className="border-white/10 bg-[#111318] text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Choose profile emoji</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                        {AVAILABLE_EMOJIS.map((em) => (
                            <button
                                key={em}
                                aria-label={`Select emoji ${em}`}
                                className="hover:bg-muted/70 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-black/20 text-xl transition"
                                onClick={() => onPickEmoji(em)}
                                type="button"
                            >
                                {em}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    )
}
