import { useEffect, useState } from "react"

export default function useQuestionTimer(
    questionExpiresAt: number | null,
    secondsToAnswer: number | null,
    ceil = true
): number | null {
    function calculateRemaining(expiresAt: number | null, shouldCeil: boolean) {
        if (!expiresAt) return null
        let time = (expiresAt - Date.now()) / 1000
        if (shouldCeil) time = Math.ceil(time)
        return Math.max(0, time)
    }
    const [timeLeft, setTimeLeft] = useState<number | null>(() => {
        if (questionExpiresAt) return calculateRemaining(questionExpiresAt, ceil)
        return secondsToAnswer
    })

    useEffect(() => {
        const expiresAt =
            questionExpiresAt ?? (secondsToAnswer ? Date.now() + secondsToAnswer * 1000 : null)
        const init = setTimeout(() => setTimeLeft(calculateRemaining(expiresAt, ceil)))
        const timer = setInterval(() => {
            const remaining = calculateRemaining(expiresAt, ceil)
            setTimeLeft(remaining)
            if (remaining === null || remaining <= 0) clearInterval(timer)
        }, 250)
        return () => {
            clearTimeout(init)
            clearInterval(timer)
        }
    }, [questionExpiresAt, secondsToAnswer, ceil])

    return timeLeft
}
