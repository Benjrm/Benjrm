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
        totalQuestions: 3,
        options: [
            { id: "a1", answer: "London" },
            { id: "a2", answer: "Berlin" },
            { id: "a3", answer: "Paris" },
            { id: "a4", answer: "Madrid" },
        ],
    },
    {
        id: "q2",
        question: "How many planets are in our solar system?",
        seconds: 30,
        type: "SINGLE_CHOICE" as const,
        totalQuestions: 3,
        options: [
            { id: "b1", answer: "7" },
            { id: "b2", answer: "8" },
            { id: "b3", answer: "9" },
            { id: "b4", answer: "10" },
        ],
    },
    {
        id: "q3",
        question: "Which language runs in a web browser?",
        seconds: 30,
        type: "SINGLE_CHOICE" as const,
        totalQuestions: 3,
        options: [
            { id: "c1", answer: "Java" },
            { id: "c2", answer: "C++" },
            { id: "c3", answer: "Python" },
            { id: "c4", answer: "JavaScript" },
        ],
    },
]

const MOCK_LEADERBOARDS = [
    {
        isFinal: false,
        leaderboard: [
            { id: "p1", name: "Funny Crocodile", emoji: "🐊", totalPoints: 950, points: 950 },
            { id: "p2", name: "Tall Giraffe", emoji: "🦒", totalPoints: 750, points: 750 },
            { id: "p3", name: "Doctor Mouse", emoji: "🐭", totalPoints: 600, points: 600 },
            { id: "p4", name: "Captain Penguin", emoji: "🐧", totalPoints: 400, points: 400 },
        ],
    },
    {
        isFinal: false,
        leaderboard: [
            { id: "p1", name: "Funny Crocodile", emoji: "🐊", totalPoints: 1850, points: 900 },
            { id: "p3", name: "Doctor Mouse", emoji: "🐭", totalPoints: 1550, points: 950 },
            { id: "p2", name: "Tall Giraffe", emoji: "🦒", totalPoints: 1400, points: 650 },
            { id: "p4", name: "Captain Penguin", emoji: "🐧", totalPoints: 900, points: 500 },
        ],
    },
    {
        isFinal: true,
        leaderboard: [
            { id: "p3", name: "Doctor Mouse", emoji: "🐭", totalPoints: 2600, points: 1050 },
            { id: "p1", name: "Funny Crocodile", emoji: "🐊", totalPoints: 2500, points: 650 },
            { id: "p2", name: "Tall Giraffe", emoji: "🦒", totalPoints: 2000, points: 600 },
            { id: "p4", name: "Captain Penguin", emoji: "🐧", totalPoints: 1500, points: 600 },
        ],
    },
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
            setTimeout(
                () => {
                    ws.simulateReceive("addPlayer", p)
                },
                200 + i * 400
            )
        )

        const afterPlayers = 200 + MOCK_PLAYERS.length * 400 + 300

        const firstQuestionTimer = setTimeout(() => {
            questionIndexRef.current = 0
            ws.simulateReceive("displayQuestion", MOCK_QUESTIONS[0])
        }, afterPlayers)

        const initialLeaderboardTimer = setTimeout(() => {
            ws.simulateReceive("displayLeaderboard", MOCK_LEADERBOARDS[0])
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
            ws.simulateReceive("displayLeaderboard", nextLeaderboard)
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
