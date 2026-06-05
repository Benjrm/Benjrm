import { useEffect, useCallback, useRef } from "react"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext"

const MOCK_PARTICIPANTS = [
    { id: "p1", name: "Funny Crocodile" },
    { id: "p2", name: "Tall Giraffe" },
    { id: "p3", name: "Doctor Mouse" },
    { id: "p4", name: "Captain Penguin" },
]

const MOCK_QUESTIONS = [
    {
        id: "q1",
        question: "What is the capital of France?",
        type: "SINGLE_CHOICE" as const,
        options: { a1: "London", a2: "Berlin", a3: "Paris", a4: "Madrid" },
    },
    {
        id: "q2",
        question: "How many planets are in our solar system?",
        type: "SINGLE_CHOICE" as const,
        options: { a1: "7", a2: "8", a3: "9", a4: "10" },
    },
    {
        id: "q3",
        question: "Which language runs in a web browser?",
        type: "SINGLE_CHOICE" as const,
        options: { a1: "Java", a2: "C++", a3: "Python", a4: "JavaScript" },
    },
]

const MOCK_LEADERBOARDS = [
    [
        { name: "Funny Crocodile", points: 950 },
        { name: "Tall Giraffe", points: 750 },
        { name: "Doctor Mouse", points: 600 },
        { name: "Captain Penguin", points: 400 },
    ],
    [
        { name: "Funny Crocodile", points: 1850 },
        { name: "Doctor Mouse", points: 1550 },
        { name: "Tall Giraffe", points: 1400 },
        { name: "Captain Penguin", points: 900 },
    ],
    [
        { name: "Doctor Mouse", points: 2600 },
        { name: "Funny Crocodile", points: 2500 },
        { name: "Tall Giraffe", points: 2000 },
        { name: "Captain Penguin", points: 1500 },
    ],
]

const MOCK_QUIZ_TITLE = "Mock Quiz — Dev Preview"

interface MockHostEventsResult {
    quizTitle: string
    handleNextQuestion: () => void
}

/**
 * Dev-only hook that fires mock WebSocket events through the real handler pipeline.
 * Activate by visiting /quiz/host?mock=true — no backend required.
 *
 * @param enabled - Whether mock mode is active.
 * @returns quizTitle and handleNextQuestion override, or null when not in mock mode.
 */
export default function useMockHostEvents(enabled: boolean): MockHostEventsResult | null {
    const ws = useWebSocketContext()
    const questionIndexRef = useRef(-1)

    useEffect(() => {
        if (!enabled) return undefined

        // Fire participants joining one by one
        const participantTimers = MOCK_PARTICIPANTS.map((p, i) =>
            setTimeout(() => ws.simulateReceive("addParticipant", p), 200 + i * 400)
        )

        const afterParticipants = 200 + MOCK_PARTICIPANTS.length * 400 + 300

        // Show first question after all participants have joined
        const firstQuestionTimer = setTimeout(() => {
            questionIndexRef.current = 0
            ws.simulateReceive("displayQuestion", MOCK_QUESTIONS[0])
        }, afterParticipants)

        // Fire initial leaderboard shortly after the first question appears
        const initialLeaderboardTimer = setTimeout(() => {
            ws.simulateReceive("updateLeaderboard", MOCK_LEADERBOARDS[0])
        }, afterParticipants + 800)

        return () => {
            participantTimers.forEach(clearTimeout)
            clearTimeout(firstQuestionTimer)
            clearTimeout(initialLeaderboardTimer)
        }
    }, [enabled, ws])

    const handleNextQuestion = useCallback(() => {
        const currentIdx = questionIndexRef.current
        const nextIdx = currentIdx + 1

        const nextLeaderboard = MOCK_LEADERBOARDS[nextIdx]
        if (nextLeaderboard) {
            ws.simulateReceive("updateLeaderboard", nextLeaderboard)
        }

        if (nextIdx >= MOCK_QUESTIONS.length) return

        setTimeout(() => {
            questionIndexRef.current = nextIdx
            ws.simulateReceive("displayQuestion", MOCK_QUESTIONS[nextIdx])
        }, 400)
    }, [ws])

    return enabled ? { quizTitle: MOCK_QUIZ_TITLE, handleNextQuestion } : null
}
