import type { JSX } from "react"
import ProgressBar from "@/shadcn/components/ui/progress"
import { cn } from "@/shadcn/lib/utils"

interface TimerBarProps {
    timeLeft: number | null
    totalSeconds: number | null
    className?: string
}

export default function TimerBar({
    timeLeft,
    totalSeconds,
    className,
}: TimerBarProps): JSX.Element | null {
    if (timeLeft === null || totalSeconds === null || totalSeconds <= 0) return null

    const progress = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))
    const indicatorClassName = (() => {
        if (progress > 60) return "bg-[#00D4E8]"
        if (progress > 30) return "bg-amber-400"
        return "bg-red-500"
    })()

    return (
        <ProgressBar
            className={cn("h-3", className)}
            indicatorClassName={indicatorClassName}
            value={progress}
        />
    )
}
