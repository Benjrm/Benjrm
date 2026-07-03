// frontend/src/components/GamePinForm.tsx

import type { JSX } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/shadcn/components/ui/input"
import { Button } from "@/shadcn/components/ui/button"

interface GamePinFormProps {
    onJoin: (digits: string) => void
    isPending?: boolean
    error?: string | null
}

export default function GamePinForm({ onJoin, isPending, error }: GamePinFormProps): JSX.Element {
    const { t } = useTranslation()
    const [digits, setDigits] = useState("")

    const displayCode = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits

    function handleJoin(): void {
        if (!digits || isPending) return
        onJoin(digits.padStart(8, "0"))
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="bg-muted/50 border-border flex flex-col items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:p-8">
                <Input
                    aria-label={t("landing.gamePinAriaLabel")}
                    className="bg-background border-border placeholder:text-muted-foreground/70 h-12 w-full text-center text-lg font-bold tracking-widest transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#00F2FF] sm:h-14 sm:text-xl"
                    disabled={isPending}
                    inputMode="numeric"
                    onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder={t("landing.gamePinPlaceholder")}
                    type="text"
                    value={displayCode}
                />
                <Button
                    className="h-12 w-full cursor-pointer bg-black px-8 text-base font-bold text-white transition-colors hover:bg-gray-800 sm:h-14 sm:w-auto sm:px-12 sm:text-lg dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    disabled={isPending}
                    onClick={() => handleJoin()}
                    size="lg"
                >
                    {isPending ? t("landing.checking") : t("landing.playButton")}
                </Button>
            </div>
            {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
        </div>
    )
}
