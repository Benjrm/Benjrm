import type { JSX } from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/shadcn/components/ui/button"
import QuestionCardContent from "@/components/QuestionCardContent"
import InfoSlideContent from "@/components/InfoSlideContent"
import OrderQuestionContent from "@/components/OrderQuestionContent"
import Leaderboard from "@/quiz/leaderboard/components/Leaderboard"
import type {
    GameState,
    GameQuestion,
    QuestionResult,
    LeaderboardEntry,
} from "@/hooks/useGameSession"

function ResultTimer({ expiresAt }: { expiresAt: number | null }): JSX.Element | null {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!expiresAt) return undefined
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [expiresAt])

    if (!expiresAt) return null
    const timeLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000))
    if (timeLeft <= 0) return null

    return (
        <div className="mt-4 flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#00D4E8]" />
            <p className="font-bold text-[#00D4E8]">Others are still answering... {timeLeft}s</p>
        </div>
    )
}

interface GameScreenProps {
    gameState: GameState
    currentQuestion: GameQuestion | null
    currentQuestionIndex: number
    totalQuestions: number
    questionResult: QuestionResult | null
    questionExpiresAt: number | null
    leaderboard: LeaderboardEntry[] | null
    isFinalLeaderboard: boolean
    playerName: string | undefined
    onNextQuestion: () => void
    onSendAnswer: (answer: string | string[]) => void
}

export default function GameScreen({
    gameState,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    questionResult,
    questionExpiresAt,
    leaderboard,
    isFinalLeaderboard,
    playerName,
    onNextQuestion,
    onSendAnswer,
}: GameScreenProps): JSX.Element | null {
    const navigate = useNavigate()

    if (gameState === "playing") {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                <h2 className="text-2xl font-bold text-white">Game is starting...</h2>
                <p className="text-muted-foreground">Get ready!</p>
            </div>
        )
    }

    if (gameState === "question" && currentQuestion) {
        if (currentQuestion.type === "SLIDE") {
            return (
                <InfoSlideContent
                    key={currentQuestion.id}
                    content={currentQuestion.text}
                    currentSlide={currentQuestionIndex + 1}
                    isHost={false}
                    onNextQuestion={onNextQuestion}
                    playerName={playerName}
                    totalSlides={totalQuestions}
                />
            )
        }

        if (currentQuestion.type === "ORDER") {
            return (
                <OrderQuestionContent
                    key={currentQuestion.id}
                    currentQuestionIndex={currentQuestionIndex}
                    isHost={false}
                    onNextQuestion={onNextQuestion}
                    onSendAnswer={(ids) => onSendAnswer(ids)}
                    options={currentQuestion.options}
                    playerName={playerName}
                    questionText={currentQuestion.text}
                    secondsToAnswer={currentQuestion.seconds}
                    totalQuestions={totalQuestions}
                />
            )
        }

        return (
            <QuestionCardContent
                key={currentQuestionIndex}
                currentQuestionIndex={currentQuestionIndex}
                isHost={false}
                onNextQuestion={onNextQuestion}
                onSendAnswer={onSendAnswer}
                options={currentQuestion.options}
                playerName={playerName}
                questionText={currentQuestion.text}
                secondsToAnswer={currentQuestion.seconds}
                totalQuestions={totalQuestions}
                type={currentQuestion.type}
            />
        )
    }

    if (gameState === "result" && questionResult) {
        const correct = questionResult.points > 0
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center text-white">
                <div
                    className={`rounded-full p-6 text-5xl ${correct ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                >
                    {correct ? "✓" : "✗"}
                </div>
                <h2 className="text-3xl font-bold">{correct ? "Correct!" : "Wrong!"}</h2>
                <p className="text-xl">+{questionResult.points} points</p>
                <p className="text-muted-foreground">Total: {questionResult.totalPoints}</p>
                <ResultTimer expiresAt={questionExpiresAt} />
                <p className="text-muted-foreground mt-8 text-sm">
                    Waiting for the host to continue...
                </p>
            </div>
        )
    }

    if (gameState === "leaderboard" && leaderboard) {
        const items = leaderboard.map((entry) => ({
            name: entry.name + (entry.emoji ? ` ${entry.emoji}` : ""),
            points: entry.totalPoints,
        }))
        return (
            <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8 text-white">
                <Leaderboard
                    items={items}
                    title={isFinalLeaderboard ? "Final Podium" : "Leaderboard"}
                />

                {isFinalLeaderboard ? (
                    <div className="mb-4 text-center text-xl font-bold text-yellow-400">
                        🏆 The quiz is finished! 🏆
                    </div>
                ) : null}

                {isFinalLeaderboard ? (
                    <div className="mt-8 flex justify-center">
                        <Button
                            className="bg-red-500 px-8 py-6 text-lg font-bold text-white hover:bg-red-600"
                            onClick={async () => navigate("/")}
                        >
                            Leave Game
                        </Button>
                    </div>
                ) : null}
            </div>
        )
    }

    return null
}
