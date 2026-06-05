import { useState, useCallback, useEffect } from "react"
import type { JSX } from "react"
import { useSearchParams } from "react-router"

import useWebSocket from "@/api/websocket/hooks/useWebSocket"
import useSocketEvent from "@/api/websocket/hooks/useSocketEvent"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext"
import useMockHostEvents from "@/api/websocket/hooks/useMockHostEvents"
import useSession from "@/api/session/hooks/useSession"
import { useQuiz } from "@/api/queries"
import { useQuestions } from "@/api/questions"

import DashboardHeader from "@/components/DashboardHeader"
import QuestionPanel from "@/components/QuestionPanel"
import SidebarLeaderboard from "@/components/SidebarLeaderboard"
import type { Answer, LeaderboardEntry } from "@/types/quiz"

const QUESTION_DURATION = 30 // seconds — update when backend provides this per-question

const ANSWER_COLORS = [
    { color: "#2d4cc9", icon: "▲" },
    { color: "#ffa602", icon: "◆" },
    { color: "#11c8d4", icon: "●" },
    { color: "#ff4949", icon: "■" },
] as const

export default function HostDashboard(): JSX.Element {
    const [searchParams] = useSearchParams()
    const code = searchParams.get("code") ?? ""
    const isMock = searchParams.get("mock") === "true"

    const { data: session } = useSession(code || undefined)
    const { data: quiz } = useQuiz(session?.quizId)
    const { data: questions } = useQuestions(session?.quizId)

    useWebSocket(code)
    const ws = useWebSocketContext()

    const [playersCount, setPlayersCount] = useState(0)
    const [answeredCount, setAnsweredCount] = useState(0)
    const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
    const [currentQuestionText, setCurrentQuestionText] = useState("")
    const [answers, setAnswers] = useState<Answer[]>([])
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return undefined
        const id = setTimeout(() => setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft])

    useSocketEvent(
        "displayQuestion",
        useCallback((payload, timing) => {
            // options is a map of { answerId: answerText }
            const options = payload.options as Record<string, string>
            setCurrentQuestionId(payload.id)
            setCurrentQuestionText(payload.question)
            setAnsweredCount(0)
            setAnswers(
                Object.entries(options).map(([id, text], idx) => ({
                    id,
                    text,
                    color: ANSWER_COLORS[idx]?.color ?? "#888",
                    icon: ANSWER_COLORS[idx]?.icon ?? "?",
                }))
            )
            const elapsedSeconds = Math.floor((Date.now() - new Date(timing).getTime()) / 1000)
            setTimeLeft(Math.max(0, QUESTION_DURATION - elapsedSeconds))
        }, [])
    )

    useSocketEvent(
        "updateLeaderboard",
        useCallback((payload) => {
            setLeaderboard(
                payload.map((entry, idx) => ({
                    id: String(idx),
                    name: entry.name,
                    points: entry.points,
                }))
            )
        }, [])
    )

    useSocketEvent(
        "addParticipant",
        useCallback(() => setPlayersCount((prev) => prev + 1), [])
    )

    useSocketEvent(
        "removeParticipant",
        useCallback(() => setPlayersCount((prev) => Math.max(0, prev - 1)), [])
    )

    // Must be called after all useSocketEvent hooks so subscriptions are registered first
    const mock = useMockHostEvents(isMock)

    const handleNextQuestion = useCallback(() => {
        if (mock) {
            mock.handleNextQuestion()
            return
        }

        if (!questions?.length) return
        const currentIdx = questions.findIndex((q) => q.id === currentQuestionId)
        const nextQuestion = questions[currentIdx + 1]
        if (!nextQuestion) return
        ws.send({ command: "showQuestion", payload: { question: nextQuestion.id } })
    }, [mock, ws, questions, currentQuestionId])

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden px-4 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <DashboardHeader
                    playersCount={playersCount}
                    quizTitle={quiz?.title ?? mock?.quizTitle ?? ""}
                    roomPin={code}
                />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                    <QuestionPanel
                        answered={answeredCount}
                        answers={answers}
                        question={currentQuestionText}
                        timeLeft={timeLeft}
                        total={playersCount}
                    />

                    <SidebarLeaderboard entries={leaderboard} onNext={handleNextQuestion} />
                </div>
            </div>
        </div>
    )
}
