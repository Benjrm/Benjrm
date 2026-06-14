import { useEffect, useCallback, useRef } from "react"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext"

const MOCK_PLAYERS = [
    { id: "p1", name: "Funny Crocodile", emoji: "🐊" },
    { id: "p2", name: "Tall Giraffe", emoji: "🦒" },
    { id: "p3", name: "Doctor Mouse", emoji: "🐭" },
    { id: "p4", name: "Captain Penguin", emoji: "🐧" },
]

const MOCK_QUESTIONS = [
    {
        id: "q1",
        question: "What is the capital of France?",
        seconds: 30,
        type: "SINGLE_CHOICE" as const,
        options: [
            { answer: "London" },
            { answer: "Berlin" },
            { answer: "Paris" },
            { answer: "Madrid" },
        ],
    },
    {
        id: "q2",
        question: "How many planets are in our solar system?",
        seconds: 30,
        type: "SINGLE_CHOICE" as const,
        options: [{ answer: "7" }, { answer: "8" }, { answer: "9" }, { answer: "10" }],
    },
    {
        id: "q3",
        question: "Which language runs in a web browser?",
        seconds: 30,
        type: "SINGLE_CHOICE" as const,
        options: [
            { answer: "Java" },
            { answer: "C++" },
            { answer: "Python" },
            { answer: "JavaScript" },
        ],
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
 * Activate by visiting /play/0/host?mock=true — no backend required.
 */
export default function useMockHostEvents(enabled: boolean): MockHostEventsResult | null {
    const ws = useWebSocketContext()
    const questionIndexRef = useRef(-1)

    useEffect(() => {
        if (!enabled) return undefined

        const playerTimers = MOCK_PLAYERS.map((p, i) =>
            setTimeout(() => ws.simulateReceive("addPlayer", p), 200 + i * 400)
        )

        const afterPlayers = 200 + MOCK_PLAYERS.length * 400 + 300

        const firstQuestionTimer = setTimeout(() => {
            questionIndexRef.current = 0
            ws.simulateReceive("displayQuestion", MOCK_QUESTIONS[0])
        }, afterPlayers)

        const initialLeaderboardTimer = setTimeout(() => {
            ws.simulateReceive("updateLeaderboard", MOCK_LEADERBOARDS[0])
        }, afterPlayers + 800)

        return () => {
            playerTimers.forEach(clearTimeout)
            clearTimeout(firstQuestionTimer)
            clearTimeout(initialLeaderboardTimer)
        }
    }, [enabled, ws])

    const handleNextQuestion = useCallback(() => {
        const nextIdx = questionIndexRef.current + 1

        const nextLeaderboard = MOCK_LEADERBOARDS[nextIdx]
        if (nextLeaderboard) {
            ws.simulateReceive("updateLeaderboard", nextLeaderboard)
        }

        const nextQuestion = MOCK_QUESTIONS[nextIdx]
        if (!nextQuestion) return

        setTimeout(() => {
            questionIndexRef.current = nextIdx
            ws.simulateReceive("displayQuestion", nextQuestion)
        }, 400)
    }, [ws])

    return enabled ? { quizTitle: MOCK_QUIZ_TITLE, handleNextQuestion } : null
}
