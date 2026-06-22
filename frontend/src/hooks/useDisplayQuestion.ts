import { useCallback, useEffect, useRef, useState } from "react"
import { useSocketEvent } from "@/api/websocket"
import useCountdown from "@/hooks/useCountdown"
import type { ServerEvents } from "@/api/websocket/types/serverEvents"

type DisplayQuestion = ServerEvents["displayQuestion"]

/**
 * Subscribes to displayQuestion WS events and manages the current question state
 * and its countdown timer. An optional `onQuestion` callback fires on each new question
 * so callers can reset their own derived state (selections, ordering, etc.) without
 * needing a second event subscription.
 */
export default function useDisplayQuestion(onQuestion?: (payload: DisplayQuestion) => void): {
    question: DisplayQuestion | null
    questionIndex: number
    timeLeft: number | null
} {
    const [question, setQuestion] = useState<DisplayQuestion | null>(null)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useCountdown(null)

    // Keep onQuestion in a ref so the socket handler stays stable
    const onQuestionRef = useRef(onQuestion)
    useEffect(() => {
        onQuestionRef.current = onQuestion
    })

    useSocketEvent(
        "displayQuestion",
        useCallback(
            (payload) => {
                setQuestion(payload)
                setQuestionIndex((prev) => prev + 1)
                setTimeLeft(payload.seconds)
                onQuestionRef.current?.(payload)
            },
            [setTimeLeft]
        )
    )

    return { question, questionIndex, timeLeft }
}
