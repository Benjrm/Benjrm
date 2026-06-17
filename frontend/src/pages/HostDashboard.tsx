import { useState, useCallback, useEffect, useRef } from "react"
import type { JSX } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import useSocketEvent from "@/api/websocket/hooks/useSocketEvent"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import useQuestions from "@/api/questions/hooks/useQuestions"
import useDisplayQuestion from "@/hooks/useDisplayQuestion"

import DashboardHeader from "@/components/DashboardHeader"
import QuestionPanel from "@/components/QuestionPanel"
import HostDashboardSidebar from "@/components/HostDashboardSidebar"
import type { LeaderboardItem } from "@/quiz/leaderboard/api/leaderboardItem"

export default function HostDashboard(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const location = useLocation()
    const navigate = useNavigate()
    const initialPlayerCount = (location.state as { playerCount?: number } | null)?.playerCount ?? 0

    const { isLoading: isSessionLoading, isHost } = useSessionStatus(code)
    const { data: quiz } = useSessionQuiz(code)
    const { data: questions } = useQuestions(quiz?.id)
    const totalQuestions = questions?.length ?? 0

    const ws = useWebSocketContext()

    const [playersCount, setPlayersCount] = useState(initialPlayerCount)
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])

    useEffect(() => {
        if (!isSessionLoading && !isHost) {
            navigate(`/play/${codeParam ?? ""}`, { replace: true })
        }
    }, [isSessionLoading, isHost, navigate, codeParam])

    const { question, questionIndex, timeLeft } = useDisplayQuestion()

    useSocketEvent(
        "error",
        useCallback((payload) => {
            console.error("WebSocket Error:", payload)
            toast.error(payload.message ?? "An error occurred communicating with the server.")
        }, [])
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

    const hasRequestedFirstQuestion = useRef(false)
    useEffect(() => {
        if (hasRequestedFirstQuestion.current) return undefined
        const sendFirstQuestion = (): void => {
            if (hasRequestedFirstQuestion.current) return
            hasRequestedFirstQuestion.current = true

            const id = Math.floor(Math.random() * 2 ** 31)
            ws.send({ id, command: "nextQuestion" })
        }
        return ws.onConnect(sendFirstQuestion)
    }, [ws])

    const handleNextQuestion = useCallback(() => {
        const id = Math.floor(Math.random() * 2 ** 31)
        ws.send({ id, command: "nextQuestion" })
    }, [ws])

    const options = question?.type === "SLIDE" ? [] : (question?.options ?? undefined)

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden px-4 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <DashboardHeader
                    playersCount={playersCount}
                    quizTitle={quiz?.title ?? ""}
                    roomPin={codeParam ?? ""}
                />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                    <QuestionPanel
                        currentQuestion={questionIndex}
                        options={options}
                        question={question?.question ?? ""}
                        questionType={question?.type ?? null}
                        timeLeft={timeLeft}
                        totalQuestions={totalQuestions}
                    />

                    <HostDashboardSidebar entries={leaderboard} onNext={handleNextQuestion} />
                </div>
            </div>
        </div>
    )
}
