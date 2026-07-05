import { useEffect, useState } from "react"

/**
 * Computes the remaining seconds until `expiresAt` (clamped to `>= 0`).
 * @param expiresAt - Target timestamp in epoch milliseconds, or `null` if there is no deadline.
 * @param shouldCeil - Whether to round the remaining time up to the nearest whole second.
 */
function calculateRemaining(expiresAt: number | null, shouldCeil: boolean) {
    if (!expiresAt) return null
    let time = (expiresAt - Date.now()) / 1000
    if (shouldCeil) time = Math.ceil(time)
    return Math.max(0, time)
}

/**
 * Ticks down the seconds remaining to answer the current question, updating
 * every 250ms until it reaches zero.
 *
 * @param questionExpiresAt - Absolute expiry timestamp (epoch ms) if known
 * (e.g. reconnecting mid-question), otherwise `null` to derive it from `secondsToAnswer`.
 * @param secondsToAnswer - Question's total answer duration in seconds, used
 * to compute an expiry when `questionExpiresAt` is `null`.
 * @param ceil - Whether to round the displayed time up to the nearest whole second.
 */
export default function useQuestionTimer(
    questionExpiresAt: number | null,
    secondsToAnswer: number | null,
    ceil = true
): number | null {
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
