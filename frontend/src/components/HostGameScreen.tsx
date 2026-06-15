import type { JSX } from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/shadcn/components/ui/button"
import type { GameState, GameQuestion, LeaderboardEntry } from "@/hooks/useGameSession"

function QuestionTimer({ expiresAt }: { expiresAt: number | null }): JSX.Element | null {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!expiresAt) return undefined
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [expiresAt])

    if (!expiresAt) return null
    const secs = Math.max(0, Math.ceil((expiresAt - now) / 1000))

    return (
        <span className={`text-sm font-black ${secs <= 5 ? "text-red-400" : "text-[#FF8A00]"}`}>
            {secs > 0 ? `${secs}s left` : "Time's up!"}
        </span>
    )
}

interface HostGameScreenProps {
    gameState: GameState
    currentQuestion: GameQuestion | null
    currentQuestionIndex: number
    totalQuestions: number
    questionExpiresAt: number | null
    leaderboard: LeaderboardEntry[] | null
    isFinalLeaderboard: boolean
    players: { id: string }[]
    codeWithDash: string | undefined
    quizTitle: string | undefined
    onNextQuestion: () => void
    onEndGame: () => void
}

export default function HostGameScreen({
    gameState,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    questionExpiresAt,
    leaderboard,
    isFinalLeaderboard,
    players,
    codeWithDash,
    quizTitle,
    onNextQuestion,
    onEndGame,
}: HostGameScreenProps): JSX.Element {
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

    return (
        <div className="min-h-screen px-4 py-8 sm:px-8">
            {/* Header */}
            <div className="mx-auto mb-8 flex w-full max-w-7xl flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Host Dashboard
                    </h1>
                    {quizTitle ? (
                        <p className="text-muted-foreground mt-1 text-base">{quizTitle}</p>
                    ) : null}
                </div>
                <div className="flex items-center gap-4">
                    {codeWithDash ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                            Room Pin: {codeWithDash}
                        </div>
                    ) : null}
                    <span className="text-muted-foreground text-sm font-medium">
                        {players.length} players
                    </span>
                </div>
            </div>

            {/* 2-column layout */}
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                {/* Question Panel */}
                <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-muted-foreground text-sm font-bold">
                            Question {currentQuestionIndex + 1} / {totalQuestions}
                        </span>
                        <QuestionTimer expiresAt={questionExpiresAt} />
                    </div>

                    {currentQuestion ? (
                        <>
                            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
                                Current Question:
                            </p>
                            <h2 className="text-xl font-bold text-white sm:text-2xl">
                                {currentQuestion.text}
                            </h2>

                            {currentQuestion.options.length > 0 ? (
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    {currentQuestion.options.map((opt, i) => {
                                        const colors = [
                                            "bg-[#2d4cc9]/20 border-[#2d4cc9]/40 text-[#6b8ef0]",
                                            "bg-[#ffa602]/20 border-[#ffa602]/40 text-[#ffc145]",
                                            "bg-[#11c8d4]/20 border-[#11c8d4]/40 text-[#11c8d4]",
                                            "bg-[#ff4949]/20 border-[#ff4949]/40 text-[#ff7070]",
                                        ]
                                        return (
                                            <div
                                                key={opt.id}
                                                className={`rounded-xl border px-4 py-3 text-sm font-medium ${colors[i] ?? colors[0]}`}
                                            >
                                                {opt.text}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <p className="text-muted-foreground text-sm">No question yet.</p>
                    )}

                    {gameState === "question" ? (
                        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                            <p className="text-muted-foreground text-sm">
                                Waiting for participants to answer
                            </p>
                        </div>
                    ) : null}

                    {gameState === "leaderboard" ? (
                        <div className="mt-6 border-t border-white/10 pt-4">
                            <p className="text-sm font-medium text-green-400">
                                Question complete — results are in!
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
                        <h3 className="mb-4 text-center text-lg font-bold text-white underline underline-offset-4">
                            Leaderboard
                        </h3>
                        {leaderboard && leaderboard.length > 0 ? (
                            <ol className="space-y-2">
                                {leaderboard.slice(0, 10).map((entry, i) => (
                                    <li key={entry.id} className="flex items-center gap-3">
                                        <span className="text-muted-foreground w-5 text-right text-sm font-bold">
                                            {i + 1}.
                                        </span>
                                        <span className="flex-1 text-sm font-medium text-white">
                                            {entry.emoji ? `${entry.emoji} ` : ""}
                                            {entry.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs font-semibold">
                                            {entry.totalPoints} pts
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-muted-foreground text-center text-sm">
                                No scores yet
                            </p>
                        )}
                    </div>

                    {isFinalLeaderboard ? (
                        <Button
                            className="w-full rounded-xl bg-red-500 py-6 text-base font-bold text-white hover:bg-red-600"
                            onClick={() => {
                                onEndGame()
                                navigate("/dashboard")
                            }}
                        >
                            End Game & Exit
                        </Button>
                    ) : (
                        <Button
                            className="w-full rounded-xl bg-[#00D4E8] py-6 text-base font-bold text-black hover:bg-[#00BDD0]"
                            onClick={onNextQuestion}
                        >
                            Next Question →
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
