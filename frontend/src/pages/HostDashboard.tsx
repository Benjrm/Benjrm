import type { JSX } from "react"
import DashboardHeader from "@/components/DashboardHeader"
import QuestionPanel from "@/components/QuestionPanel"
import SidebarLeaderboard from "@/components/SidebarLeaderboard"
import type { Answer, LeaderboardEntry } from "@/types/quiz"

export default function HostDashboard(): JSX.Element {
    // UI-only mock data
    const roomPin = "123 456"
    const playersCount = 24
    const answered = 13
    const total = playersCount
    const currentQuestion = "Why did the chicken cross the road?"

    const answers: Answer[] = [
        { id: "1", text: "To get to the other side", color: "#2d4cc9", icon: "▲" },
        { id: "2", text: "Because it was bored", color: "#ffa602", icon: "◆" },
        { id: "3", text: "To prove it wasn't a turkey", color: "#11c8d4", icon: "●" },
        { id: "4", text: "I don't know", color: "#ff4949", icon: "■" },
    ]

    const leaderboard: LeaderboardEntry[] = [
        { id: "1", name: "Funny Crocodile", points: 2395 },
        { id: "2", name: "Tall Goose", points: 2192 },
        { id: "3", name: "Doctor Mouse", points: 1877 },
    ]

    const handleNextQuestion = () => {
        // TODO: implement logic later
    }

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden px-4 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <DashboardHeader playersCount={playersCount} roomPin={roomPin} />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                    <QuestionPanel
                        answered={answered}
                        answers={answers}
                        question={currentQuestion}
                        total={total}
                    />

                    <SidebarLeaderboard entries={leaderboard} onNext={handleNextQuestion} />
                </div>
            </div>
        </div>
    )
}
