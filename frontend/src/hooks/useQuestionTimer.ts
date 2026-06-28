import { useEffect, useState } from "react"

export default function useQuestionTimer(
    questionExpiresAt: number | null,
    secondsToAnswer: number | null
): number | null {
    function calculateRemaining(expiresAt: number | null) {
        return expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : null
    }
    const [timeLeft, setTimeLeft] = useState<number | null>(() => {
        if (questionExpiresAt) return calculateRemaining(questionExpiresAt)
        return secondsToAnswer
    })

    useEffect(() => {
        const expiresAt =
            questionExpiresAt ?? (secondsToAnswer ? Date.now() + secondsToAnswer * 1000 : null)
        const init = setTimeout(() => setTimeLeft(calculateRemaining(expiresAt)))
        const timer = setInterval(() => {
            const remaining = calculateRemaining(expiresAt)
            setTimeLeft(remaining)
            if (remaining === null || remaining <= 0) clearInterval(timer)
        }, 500)
        return () => {
            clearTimeout(init)
            clearInterval(timer)
        }
    }, [questionExpiresAt, secondsToAnswer])

    return timeLeft
}
