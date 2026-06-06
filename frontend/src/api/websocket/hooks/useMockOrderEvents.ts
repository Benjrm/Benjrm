import { useEffect } from "react"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext"

const MOCK_QUESTION = {
    id: "mock-order-1",
    question: "Sort these programming languages by year of first release (oldest first).",
    type: "ORDER" as const,
    options: {
        fortran: "Fortran",
        python: "Python",
        javascript: "JavaScript",
        rust: "Rust",
    },
}

/**
 * Dev-only hook that fires a mock ORDER displayQuestion event through the real handler pipeline.
 * Activate by visiting /quiz/order?mock=true — no backend required.
 *
 * @param enabled - Whether mock mode is active.
 */
export default function useMockOrderEvents(enabled: boolean): void {
    const ws = useWebSocketContext()

    useEffect(() => {
        if (!enabled) return undefined

        const timer = setTimeout(() => {
            ws.simulateReceive("displayQuestion", MOCK_QUESTION)
        }, 500)

        return () => clearTimeout(timer)
    }, [enabled, ws])
}
