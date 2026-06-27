import { useEffect, useState } from "react"

export default function useQuestionTimer(
    questionExpiresAt: number | null,
    secondsToAnswer: number | null
): number | null {
    const [timeLeft, setTimeLeft] = useState<number | null>(() => {
        if (questionExpiresAt)
            return Math.max(0, Math.ceil((questionExpiresAt - Date.now()) / 1000))
        return secondsToAnswer
    })

    useEffect(() => {
        const expiresAt =
            questionExpiresAt ?? (secondsToAnswer ? Date.now() + secondsToAnswer * 1000 : null)
        if (expiresAt === null) return undefined
        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
            setTimeLeft(remaining)
            if (remaining <= 0) clearInterval(timer)
        }, 500)
        return () => clearInterval(timer)
    }, [questionExpiresAt, secondsToAnswer])

    return timeLeft
}
