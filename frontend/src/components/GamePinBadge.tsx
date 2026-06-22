import type { JSX } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface GamePinBadgeProps {
    codeWithDash: string | undefined
}

export default function GamePinBadge({ codeWithDash }: GamePinBadgeProps): JSX.Element | null {
    if (!codeWithDash) return null

    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-2 dark:bg-black/20">
            <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                    Game Pin
                </p>
                <p className="font-mono text-xl font-black tracking-widest">{codeWithDash}</p>
            </div>
            <button
                className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
                title="Copy Game Pin"
                type="button"
                onClick={() => {
                    navigator.clipboard.writeText(codeWithDash).catch(() => {})
                    toast.success("Game Pin copied!")
                }}
            >
                <Copy className="h-5 w-5" />
            </button>
        </div>
    )
}
