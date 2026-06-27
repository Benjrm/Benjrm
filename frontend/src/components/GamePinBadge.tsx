import type { JSX } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface GamePinBadgeProps {
    codeWithDash: string | undefined
}

export default function GamePinBadge({ codeWithDash }: GamePinBadgeProps): JSX.Element | null {
    const { t } = useTranslation()
    if (!codeWithDash) return null

    return (
        <div className="inline-flex items-center gap-3 rounded-full border border-[#00D4E8]/20 bg-[#00D4E8]/10 px-4 py-2 shadow-[0_0_16px_-4px_rgba(0,212,232,0.3)]">
            <span className="text-xs font-bold tracking-widest text-[#00D4E8] uppercase">
                {t("lobby.pin.label")}
            </span>
            <span className="font-mono text-lg font-black tracking-widest">{codeWithDash}</span>
            <button
                className="text-[#00D4E8]/60 transition-colors hover:text-[#00D4E8]"
                title={t("lobby.pin.copyTitle")}
                type="button"
                onClick={() => {
                    navigator.clipboard.writeText(codeWithDash).catch(() => {})
                    toast.success(t("lobby.pin.copied"))
                }}
            >
                <Copy className="h-4 w-4" />
            </button>
        </div>
    )
}
