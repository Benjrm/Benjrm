import { useState, useCallback, useEffect, useRef } from "react"
import type { JSX } from "react"
import { useLocation, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"

import useSocketEvent from "@/api/websocket/hooks/useSocketEvent"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext"
import useMockHostEvents from "@/api/websocket/hooks/useMockHostEvents"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import useQuestions from "@/api/questions/hooks/useQuestions"
import useCountdown from "@/hooks/useCountdown"

import DashboardHeader from "@/components/DashboardHeader"
import QuestionPanel from "@/components/QuestionPanel"
import HostDashboardSidebar from "@/components/HostDashboardSidebar"
import type { Answer } from "@/types/quiz"
import type { LeaderboardItem } from "@/quiz/leaderboard/api/leaderboardItem"

const ANSWER_COLORS = [
    { color: "#2d4cc9", icon: "▲" },
    { color: "#ffa602", icon: "◆" },
    { color: "#11c8d4", icon: "●" },
    { color: "#ff4949", icon: "■" },
] as const

export default function HostDashboard(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const [searchParams] = useSearchParams()
    const isMock = searchParams.get("mock") === "true"
    const location = useLocation()
    const initialPlayerCount = (location.state as { playerCount?: number } | null)?.playerCount ?? 0

    const { data: quiz } = useSessionQuiz(code)
    const { data: questions } = useQuestions(quiz?.id)
    const totalQuestions = questions?.length ?? 0

    const ws = useWebSocketContext()

    const [playersCount, setPlayersCount] = useState(initialPlayerCount)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [currentQuestionText, setCurrentQuestionText] = useState("")
    const [answers, setAnswers] = useState<Answer[]>([])
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
    const [timeLeft, setTimeLeft] = useCountdown(null)

    // Error listener to catch backend rejections
    useSocketEvent(
        "error",
        useCallback((payload) => {
            console.error("WebSocket Error:", payload)
            toast.error(payload.message ?? "An error occurred communicating with the server.")
        }, [])
    )

    useSocketEvent(
        "displayQuestion",
        useCallback(
            (payload) => {
                setCurrentQuestion((prev) => prev + 1)
                setCurrentQuestionText(payload.question)
                if (payload.type === "SLIDE") {
                    setAnswers([])
                } else {
                    setAnswers(
                        payload.options.map((opt, idx) => ({
                            id: `${payload.id}-${idx}`,
                            text: opt.answer,
                            color: ANSWER_COLORS[idx]?.color ?? "#888",
                            icon: ANSWER_COLORS[idx]?.icon ?? "?",
                        }))
                    )
                }
                setTimeLeft(payload.seconds)
            },
            [setTimeLeft]
        )
    )

    useSocketEvent(
        "updateLeaderboard",
        useCallback((payload) => {
            setLeaderboard(
                payload.map((entry) => ({
                    name: entry.name,
                    points: entry.points,
                }))
            )
        }, [])
    )

    useSocketEvent(
        "addPlayer",
        useCallback(() => setPlayersCount((prev) => prev + 1), [])
    )

    useSocketEvent(
        "removePlayer",
        useCallback(() => setPlayersCount((prev) => Math.max(0, prev - 1)), [])
    )

    const mock = useMockHostEvents(isMock)

    // Automatically show the first question when the host dashboard mounts.
    // Uses onConnect so the send waits for the socket to be OPEN rather than throwing
    // if the component mounts while the connection is still being established.
    const hasRequestedFirstQuestion = useRef(false)
    useEffect(() => {
        if (isMock || hasRequestedFirstQuestion.current) return undefined
        const sendFirstQuestion = (): void => {
            if (hasRequestedFirstQuestion.current) return
            hasRequestedFirstQuestion.current = true

            const id = Math.floor(Math.random() * 2 ** 31)
            ws.send({ id, command: "nextQuestion" })
        }
        return ws.onConnect(sendFirstQuestion)
    }, [ws, isMock])

    const handleNextQuestion = useCallback(() => {
        if (mock) {
            mock.handleNextQuestion()
            return
        }

        const id = Math.floor(Math.random() * 2 ** 31)
        ws.send({ id, command: "nextQuestion" })
    }, [mock, ws])

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden px-4 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <DashboardHeader
                    playersCount={playersCount}
                    quizTitle={quiz?.title ?? mock?.quizTitle ?? ""}
                    roomPin={codeParam ?? ""}
                />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                    <QuestionPanel
                        answers={answers}
                        currentQuestion={currentQuestion}
                        question={currentQuestionText}
                        timeLeft={timeLeft}
                        totalQuestions={totalQuestions}
                    />

                    <HostDashboardSidebar entries={leaderboard} onNext={handleNextQuestion} />
                </div>
            </div>
        </div>
    )
}
