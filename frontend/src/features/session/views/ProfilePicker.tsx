import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@shadcn/components/ui/button.tsx"
import { Input } from "@shadcn/components/ui/input.tsx"

interface ProfilePickerProps {
    name: string
    emoji?: string
    pending: boolean
    nameError: string | null
    onNameChange: (v: string) => void
    onOpenEmoji: () => void
    onSaveName: () => void
}

export default function ProfilePicker({
    name,
    emoji,
    pending,
    nameError,
    onNameChange,
    onOpenEmoji,
    onSaveName,
}: Readonly<ProfilePickerProps>): JSX.Element {
    const { t } = useTranslation()

    return (
        <div className="flex w-full items-start gap-4">
            <Button
                aria-label={t("lobby.profile.chooseProfileEmoji")}
                className="text-foreground h-16 w-16 shrink-0 rounded-full border border-white/20 bg-[#00D4E8]/20 p-0 text-2xl shadow-[0_0_0_2px_rgba(0,212,232,0.2)] hover:bg-[#00D4E8]/30"
                onClick={onOpenEmoji}
                type="button"
                variant="ghost"
            >
                {emoji ?? "🙂"}
            </Button>

            <div className="flex w-full flex-col gap-2">
                <div className="flex flex-row gap-2">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {t("lobby.profile.chooseName")}
                    </p>
                    {nameError ? <p className="text-xs text-red-400">{nameError}</p> : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        aria-label={t("lobby.profile.choosePlayerName")}
                        className="border-white/10 bg-black/20 text-base"
                        id="profile-name-input"
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder={t("lobby.profile.chooseName")}
                        value={name}
                    />
                    <Button
                        className="w-full border-0 bg-[#00D4E8] font-semibold text-black shadow-[0_0_20px_-6px_rgba(0,212,232,0.75)] hover:bg-[#00BDD0] sm:w-auto"
                        disabled={!name.trim() || pending}
                        onClick={onSaveName}
                        type="button"
                    >
                        {pending ? t("lobby.profile.saving") : t("lobby.profile.save")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
