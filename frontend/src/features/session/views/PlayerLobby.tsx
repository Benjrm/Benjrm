import type { JSX } from "react"
import { Toaster } from "sonner"
import { useTranslation } from "react-i18next"
import Lobby from "./Lobby"
import ProfilePicker from "@/features/session/views/ProfilePicker.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"

import AVAILABLE_EMOJIS from "@/features/session/constants/availableEmojis.ts"

interface PlayerLobbyProps {
    codeWithDash?: string
    name: string
    emoji: string
    nameSaved: boolean
    nameError: string | null
    namePending: boolean
    isEmojiOpen: boolean
    onNameChange: (name: string) => void
    onSaveName: () => void
    onPickEmoji: (emoji: string) => void
    onOpenEmoji: () => void
    onCloseEmoji: (open: boolean) => void
}

export default function PlayerLobby({
    codeWithDash,
    name,
    emoji,
    nameSaved,
    nameError,
    namePending,
    isEmojiOpen,
    onNameChange,
    onSaveName,
    onPickEmoji,
    onOpenEmoji,
    onCloseEmoji,
}: PlayerLobbyProps): JSX.Element {
    const { t } = useTranslation()
    return (
        <>
            <Lobby codeWithDash={codeWithDash}>
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
                                    pending={namePending}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center border-t border-white/10 pt-6">
                    <p className="text-muted-foreground text-sm font-medium">
                        {t("lobby.player.waitingForHost")}
                    </p>
                </div>
            </Lobby>

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
        </>
    )
}
