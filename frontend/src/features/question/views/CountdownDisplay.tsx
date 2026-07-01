import type { ReactNode } from "react"

interface CountdownDisplayProps {
    timeLeft: number | null
    variant?: "host" | "player"
}

function formatTimeLeft(seconds: number): string {
    if (seconds <= 0) return "Time's up!"
    if (seconds < 60) return `${seconds}s left`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs === 0 ? `${mins}m left` : `${mins}m ${secs}s left`
}

export default function CountdownDisplay({
    timeLeft,
    variant = "host",
}: CountdownDisplayProps): ReactNode {
    if (timeLeft === null) return null

    const text = formatTimeLeft(timeLeft)

    if (variant === "player") {
        return (
            <span
                className={`text-sm font-black ${timeLeft <= 5 ? "text-red-400" : "text-[#FF8A00]"}`}
            >
                {text}
            </span>
        )
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold tracking-tight text-[#FF8A00] shadow-[0_0_15px_rgba(255,138,0,0.2)]">
            {text}
        </div>
    )
}
