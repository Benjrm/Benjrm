import { useEffect, useState } from "react"
import type { JSX } from "react"
import ProgressBar from "@/shadcn/components/ui/progress"
import { cn } from "@/shadcn/lib/utils"

function calculateProgress(left: number | null, total: number | null) {
    if (left === null || total === null) return null
    return Math.max(0, Math.min(100, (left / total) * 100))
}

interface TimerBarProps {
    timeLeft: number | null
    totalSeconds: number | null
    animationMs: number
    className?: string
}

export default function TimerBar({
    timeLeft,
    totalSeconds,
    animationMs,
    className,
}: TimerBarProps): JSX.Element | null {
    const [progress, setProgress] = useState(calculateProgress(timeLeft, totalSeconds))

    const indicatorClassName = (() => {
        if (progress !== null && progress > 60) return "bg-[#00D4E8]"
        if (progress !== null && progress > 30) return "bg-amber-400"
        return "bg-red-500"
    })()

    useEffect(() => {
        const id = setTimeout(() => {
            setProgress(
                calculateProgress(timeLeft ? timeLeft - animationMs / 1000 : null, totalSeconds)
            )
        })
        return () => clearTimeout(id)
    }, [timeLeft, totalSeconds, animationMs])

    return (
        <ProgressBar
            className={cn("h-3", className)}
            indicatorClassName={`duration-${animationMs} ${indicatorClassName}`}
            value={progress}
        />
    )
}
