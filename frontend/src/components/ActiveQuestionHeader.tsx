import { useEffect, useRef, useState } from "react"
import type { JSX } from "react"

interface ActiveQuestionHeaderProps {
    questionText: string
    questionNumber: number
    initialTimeLeft: number
    questionDuration: number
    onTimeUp: () => void
}

export default function ActiveQuestionHeader({
    questionText,
    questionNumber,
    initialTimeLeft,
    questionDuration,
    onTimeUp,
}: ActiveQuestionHeaderProps): JSX.Element {
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft)
    const onTimeUpRef = useRef(onTimeUp)
    useEffect(() => {
        onTimeUpRef.current = onTimeUp
    }, [onTimeUp])

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUpRef.current()
            return undefined
        }
        const id = setTimeout(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft])

    const timerPercent = Math.max(0, (timeLeft / questionDuration) * 100)

    return (
        <div className="bg-muted/20 border-border/10 rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="mb-4 flex items-start justify-between">
                <span className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
                    Question {questionNumber}
                </span>
                <span className="text-foreground text-3xl font-black tracking-tight sm:text-4xl">
                    {timeLeft}
                </span>
            </div>

            <h1 className="text-foreground max-w-md text-3xl leading-tight font-black tracking-tight sm:text-4xl">
                {questionText}
            </h1>

            <div className="mt-5 h-3 w-full rounded-full bg-white/5">
                <div
                    className="h-full rounded-full bg-[#00F2FF] shadow-[0_0_18px_rgba(0,242,255,0.65)] transition-[width] duration-1000 ease-linear"
                    style={{ width: `${timerPercent}%` }}
                />
            </div>
        </div>
    )
}
