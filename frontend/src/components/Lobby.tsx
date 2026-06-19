import type { JSX } from "react"
import { useEffect, useRef, useState } from "react"
import { Maximize2, Minimize2, QrCode, Users, X } from "lucide-react"
import QRCode from "react-qr-code"
import { Toaster } from "sonner"
import GamePinBadge from "@/components/GamePinBadge"
import ProfilePicker from "@/components/ProfilePicker"
import StartQuizButton from "@/components/StartQuizButton"
import { Button } from "@/shadcn/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"
import { AVAILABLE_EMOJIS } from "@/hooks/useGameSession"
import type { Player } from "@/hooks/useGameSession"

interface LobbyProps {
    codeWithDash: string | undefined
    quiz: { title: string } | undefined
    isHost: boolean
    players: Player[]
    name: string
    emoji: string
    nameSaved: boolean
    nameError: string | null
    pendingId: number | null
    pendingStartId: number | null
    isEmojiOpen: boolean
    onNameChange: (name: string) => void
    onSaveName: () => void
    onKickPlayer: (id: string) => void
    onPickEmoji: (emoji: string) => void
    onOpenEmoji: () => void
    onCloseEmoji: (open: boolean) => void
    onStartGame: () => void
}

export default function Lobby({
    codeWithDash,
    quiz,
    isHost,
    players,
    name,
    emoji,
    nameSaved,
    nameError,
    pendingId,
    pendingStartId,
    isEmojiOpen,
    onNameChange,
    onSaveName,
    onKickPlayer,
    onPickEmoji,
    onOpenEmoji,
    onCloseEmoji,
    onStartGame,
}: LobbyProps): JSX.Element {
    const [hostTab, setHostTab] = useState<"players" | "qr">("players")
    const [isFullscreen, setIsFullscreen] = useState(false)
    const qrFullscreenRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null)
        document.addEventListener("fullscreenchange", onFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            qrFullscreenRef.current?.requestFullscreen().catch(() => {})
        } else {
            document.exitFullscreen().catch(() => {})
        }
    }

    const joinUrl =
        codeWithDash !== undefined
            ? `${window.location.origin}/play/${codeWithDash.replace("-", "")}`
            : ""

    return (
        <section className="mx-auto w-full max-w-4xl py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    Waiting Lobby
                </div>
                <GamePinBadge codeWithDash={codeWithDash} />
            </div>

            <div className="dark:text-foreground overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111318]">
                <div className="bg-linear-to-r from-[#00D4E8]/10 via-transparent to-[#FF8A00]/10 p-6 sm:p-8">
                    {isHost ? (
                        <>
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
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

                                <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-black/10 p-1 dark:bg-black/20">
                                    <button
                                        onClick={() => setHostTab("players")}
                                        type="button"
                                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            hostTab === "players"
                                                ? "bg-[#00D4E8] text-black"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        Players
                                    </button>
                                    <button
                                        onClick={() => setHostTab("qr")}
                                        type="button"
                                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            hostTab === "qr"
                                                ? "bg-[#00D4E8] text-black"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <QrCode className="h-3.5 w-3.5" />
                                        QR Code
                                    </button>
                                </div>
                            </div>

                            {hostTab === "players" ? (
                                <ul className="space-y-2">
                                    {players.map((player) => (
                                        <li
                                            key={player.id}
                                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 dark:bg-black/20"
                                        >
                                            <div className="bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase">
                                                {player.emoji ?? player.name.charAt(0)}
                                            </div>
                                            <p className="flex-1 text-sm font-medium">
                                                {player.name}
                                            </p>
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
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-2">
                                    <div
                                        ref={qrFullscreenRef}
                                        className={`flex flex-col items-center gap-6 rounded-2xl bg-white p-4 ${
                                            isFullscreen
                                                ? "h-screen w-screen justify-center rounded-none p-12"
                                                : ""
                                        }`}
                                    >
                                        <QRCode size={isFullscreen ? 420 : 200} value={joinUrl} />
                                        {isFullscreen ? (
                                            <>
                                                <div className="text-center">
                                                    <p className="text-2xl font-black tracking-widest text-black">
                                                        {codeWithDash}
                                                    </p>
                                                    <p className="mt-1 font-mono text-sm text-gray-500">
                                                        {joinUrl}
                                                    </p>
                                                </div>
                                                <button
                                                    className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"
                                                    onClick={toggleFullscreen}
                                                    type="button"
                                                >
                                                    <Minimize2 className="h-4 w-4" />
                                                    Exit fullscreen
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                    {!isFullscreen && (
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-muted-foreground max-w-xs text-center text-xs">
                                                Scan to join at{" "}
                                                <span className="text-foreground font-mono font-semibold">
                                                    {joinUrl}
                                                </span>
                                            </p>
                                            <button
                                                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
                                                onClick={toggleFullscreen}
                                                type="button"
                                            >
                                                <Maximize2 className="h-3.5 w-3.5" />
                                                Show fullscreen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                            onNameChange={onNameChange}
                                            onOpenEmoji={onOpenEmoji}
                                            onSaveName={onSaveName}
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
                                disabled={pendingStartId !== null}
                                onStartQuiz={onStartGame}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm font-medium">
                                Waiting for host to start the game
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Toaster richColors />

            <Dialog onOpenChange={onCloseEmoji} open={isEmojiOpen}>
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
