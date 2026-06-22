import type { JSX } from "react"
import { X } from "lucide-react"
import { Toaster } from "sonner"
import { useTranslation } from "react-i18next"
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
    const { t } = useTranslation()
    return (
        <section className="mx-auto w-full max-w-4xl py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    {t("lobby.waitingLobby")}
                </div>
                <GamePinBadge codeWithDash={codeWithDash} />
            </div>

            <div className="dark:text-foreground overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111318]">
                <div className="bg-linear-to-r from-[#00D4E8]/10 via-transparent to-[#FF8A00]/10 p-6 sm:p-8">
                    {isHost ? (
                        <>
                            <div className="mb-4">
                                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                                    {quiz?.title ?? t("lobby.host.noTitle")}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {t("lobby.host.playersJoined")}{" "}
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
                                            type="button"
                                            variant="ghost"
                                            title={t("lobby.host.kickPlayer", {
                                                name: player.name,
                                            })}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                                {players.length === 0 ? (
                                    <li className="text-muted-foreground py-4 text-center text-sm">
                                        {t("lobby.host.noPlayers")}
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
                                            {t("lobby.player.youreIn")}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-sm font-semibold tracking-wide">
                                            {t("lobby.player.playerSetup")}
                                        </p>
                                        <span className="text-muted-foreground text-xs">
                                            {t("lobby.player.tapAvatarHint")}
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
                                {t("lobby.player.waitingForHost")}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Toaster richColors />

            <Dialog onOpenChange={onCloseEmoji} open={isEmojiOpen}>
                <DialogContent className="border-white/10 bg-[#111318] text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("lobby.profile.chooseProfileEmoji")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                        {AVAILABLE_EMOJIS.map((em) => (
                            <button
                                key={em}
                                aria-label={t("lobby.profile.selectEmoji", { emoji: em })}
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
