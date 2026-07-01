import type { JSX } from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { Toaster } from "sonner"
import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import HostGameQuestionStatistic from "@/features/question/views/HostGameQuestionStatistic"
import { Button } from "@/shadcn/components/ui/button"
import HostDashboardSidebar from "@/features/session/views/HostDashboardSidebar"
import GamePinBadge from "@/features/session/views/GamePinBadge"
import Leaderboard from "@/features/session/leaderboard/components/Leaderboard"
import MarkdownPageComponent from "@/shared/views/markdown/MarkdownPageComponent"
import MarkdownComponent from "@/shared/views/markdown/MarkdownComponent"
import { GameStateEnum } from "@/features/session/hooks/useGameSession"
import type {
    GameState,
    GameQuestion,
    LeaderboardEntry,
} from "@/features/session/hooks/useGameSession"
import useQuestionStatistics from "@/features/question/hooks/useQuestionStatistics"
import type { QuestionStatistics } from "@/features/question/hooks/useQuestionStatistics"

function QuestionTimer({ expiresAt }: { expiresAt: number | null }): JSX.Element | null {
    const { t } = useTranslation()
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
            {secs > 0 ? t("game.host.timeLeft", { secs }) : t("game.host.timesUp")}
        </span>
    )
}

interface HostGameScreenProps {
    gameState: GameState
    currentQuestion: GameQuestion | null
    currentQuestionIndex: number
    totalQuestions: number
    questionExpiresAt: number | null
    questionStartsAt: number | null
    leaderboard: LeaderboardEntry[] | null
    isFinalLeaderboard: boolean
    players: { id: string; name: string; emoji: string | null }[]
    codeWithDash: string | undefined
    quizTitle: string | undefined
    onNextQuestion: () => void
    onEndGame: () => void
    onShowPodium?: () => void
    questionStatistics: QuestionStatistics | null
}

export default function HostGameScreen({
    gameState,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    questionExpiresAt,
    questionStartsAt,
    leaderboard,
    isFinalLeaderboard,
    players,
    codeWithDash,
    quizTitle,
    onNextQuestion,
    onEndGame,
    onShowPodium,
    questionStatistics,
}: HostGameScreenProps): JSX.Element {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [playersPreviewing, setPlayersPreviewing] = useState(false)
    const prevQuestionIndexRef = useRef(-1)

    useEffect(() => {
        if (
            gameState === GameStateEnum.QUESTION &&
            currentQuestionIndex !== prevQuestionIndexRef.current
        ) {
            prevQuestionIndexRef.current = currentQuestionIndex
            if (questionStartsAt !== null) {
                const time = questionStartsAt - Date.now()
                const start = setTimeout(() => setPlayersPreviewing(time > 0))
                let timer: number | null = null
                if (time > 0) {
                    timer = setTimeout(() => setPlayersPreviewing(false), time)
                }
                return () => {
                    clearTimeout(start)
                    if (timer !== null) clearTimeout(timer)
                }
            }
        }
        return undefined
    }, [gameState, currentQuestionIndex, questionStartsAt])

    const { statisticOptions, totalAnswers } = useQuestionStatistics(
        currentQuestion,
        questionStatistics
    )

    if (isFinalLeaderboard && leaderboard) {
        const items = leaderboard.map((entry) => ({
            name: entry.name,
            points: entry.totalPoints,
            avatar: entry.emoji ?? undefined,
        }))
        return (
            <>
                <Toaster richColors />
                <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6 p-8">
                    <Leaderboard items={items} title={t("game.leaderboard.finalPodium")} />
                    <p className="text-xl font-bold text-yellow-500">
                        {t("game.leaderboard.finished")}
                    </p>
                    <Button
                        className="bg-red-500 px-8 py-6 text-lg font-bold text-white hover:bg-red-600"
                        onClick={() => {
                            onEndGame()
                            navigate("/dashboard")
                        }}
                    >
                        {t("game.host.endGame")}
                    </Button>
                </div>
            </>
        )
    }

    if (gameState === GameStateEnum.PLAYING) {
        return (
            <>
                <Toaster richColors />
                <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-[#00D4E8] dark:border-white/10" />
                    <h2 className="text-2xl font-bold">{t("game.starting")}</h2>
                    <p className="text-muted-foreground">{t("game.getReady")}</p>
                </div>
            </>
        )
    }

    const answerColors = [
        "bg-[#2d4cc9]/20 border-[#2d4cc9]/40 text-[#6b8ef0]",
        "bg-[#ffa602]/20 border-[#ffa602]/40 text-[#ffc145]",
        "bg-[#11c8d4]/20 border-[#11c8d4]/40 text-[#11c8d4]",
        "bg-[#ff4949]/20 border-[#ff4949]/40 text-[#ff7070]",
    ]

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8 sm:px-8">
            <Toaster richColors />
            {/* Header */}
            <div className="mx-auto mb-8 flex w-full max-w-7xl flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {t("game.host.dashboard")}
                    </h1>
                    {quizTitle ? (
                        <p className="text-muted-foreground mt-1 text-base">{quizTitle}</p>
                    ) : null}
                </div>
                <div className="flex items-center gap-4">
                    <GamePinBadge codeWithDash={codeWithDash} />
                    <span className="text-muted-foreground text-sm font-medium">
                        {t("game.host.players", { count: players.length })}
                    </span>
                </div>
            </div>

            {/* 2-column layout */}
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                {/* Question Panel */}
                <div className="bg-card text-card-foreground flex flex-col rounded-2xl border p-6">
                    {gameState === GameStateEnum.LEADERBOARD &&
                    currentQuestion &&
                    currentQuestion.type !== "SLIDE" ? (
                        <HostGameQuestionStatistic
                            currentQuestionIndex={currentQuestionIndex}
                            expectedAnswers={players.length}
                            options={statisticOptions}
                            questionStatistics={questionStatistics}
                            questionText={currentQuestion.text}
                            questionType={currentQuestion.type}
                            totalAnswers={totalAnswers}
                            totalQuestions={totalQuestions}
                        />
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-muted-foreground text-sm font-bold">
                                    {t("game.question.label", {
                                        current: currentQuestionIndex + 1,
                                        total: totalQuestions,
                                    })}
                                </span>
                                {playersPreviewing && currentQuestion?.type !== "SLIDE" ? (
                                    <span className="text-muted-foreground text-sm font-semibold">
                                        {t("game.question.playersReading")}
                                    </span>
                                ) : (
                                    <QuestionTimer
                                        expiresAt={
                                            gameState === GameStateEnum.QUESTION
                                                ? questionExpiresAt
                                                : null
                                        }
                                    />
                                )}
                            </div>

                            {currentQuestion ? (
                                <>
                                    {currentQuestion.type === "SLIDE" ? (
                                        <MarkdownPageComponent content={currentQuestion.text} />
                                    ) : (
                                        <>
                                            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
                                                {t("game.question.current")}
                                            </p>
                                            <div className="text-xl font-bold sm:text-2xl [&_p]:m-0 [&_p]:text-xl [&_p]:font-bold sm:[&_p]:text-2xl">
                                                <MarkdownComponent content={currentQuestion.text} />
                                            </div>

                                            {currentQuestion.type === "ORDER" &&
                                            currentQuestion.options.length > 0 ? (
                                                <ol className="mt-6 flex flex-col gap-2">
                                                    {currentQuestion.options.map((opt, i) => (
                                                        <li
                                                            key={opt.id}
                                                            className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium"
                                                        >
                                                            <span className="text-muted-foreground w-5 shrink-0 text-center font-bold">
                                                                {i + 1}
                                                            </span>
                                                            <div className="[&_p]:m-0">
                                                                <ReactMarkdown
                                                                    unwrapDisallowed
                                                                    remarkPlugins={[remarkGfm]}
                                                                    allowedElements={[
                                                                        "p",
                                                                        "strong",
                                                                        "em",
                                                                        "code",
                                                                        "del",
                                                                        "s",
                                                                    ]}
                                                                >
                                                                    {opt.text}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : null}
                                            {currentQuestion.type !== "ORDER" &&
                                            currentQuestion.options.length > 0 ? (
                                                <div className="mt-6 grid grid-cols-2 gap-3">
                                                    {currentQuestion.options.map((opt, i) => (
                                                        <div
                                                            key={opt.id}
                                                            className={`rounded-xl border px-4 py-3 text-sm font-medium [&_p]:m-0 ${answerColors[i] ?? answerColors[0]}`}
                                                        >
                                                            <ReactMarkdown
                                                                unwrapDisallowed
                                                                remarkPlugins={[remarkGfm]}
                                                                allowedElements={[
                                                                    "p",
                                                                    "strong",
                                                                    "em",
                                                                    "code",
                                                                    "del",
                                                                    "s",
                                                                ]}
                                                            >
                                                                {opt.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    {t("game.question.noQuestion")}
                                </p>
                            )}

                            {gameState === GameStateEnum.QUESTION &&
                            currentQuestion?.type !== "SLIDE" ? (
                                <div className="mt-6 flex items-center gap-3 border-t pt-4">
                                    <div className="border-muted-foreground/20 border-t-muted-foreground/60 h-4 w-4 animate-spin rounded-full border-2" />
                                    <p className="text-muted-foreground text-sm">
                                        {t("game.question.waitingForAnswers")}
                                    </p>
                                </div>
                            ) : null}

                            {gameState === GameStateEnum.LEADERBOARD ? (
                                <div className="mt-6 border-t pt-4">
                                    <p className="text-sm font-medium text-green-500">
                                        {t("game.question.complete")}
                                    </p>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <HostDashboardSidebar
                    isFinal={isFinalLeaderboard}
                    onNext={onNextQuestion}
                    entries={
                        leaderboard && leaderboard.length > 0
                            ? leaderboard.map((entry) => ({
                                  name: entry.name,
                                  points: entry.totalPoints,
                                  avatar: entry.emoji ?? undefined,
                              }))
                            : players.map((p) => ({
                                  name: p.name,
                                  points: 0,
                                  avatar: p.emoji ?? undefined,
                              }))
                    }
                    isLastQuestion={
                        totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1
                    }
                    onEnd={() => {
                        onEndGame()
                        navigate("/dashboard")
                    }}
                    onShowPodium={
                        onShowPodium ??
                        (currentQuestion?.type === "SLIDE" &&
                        totalQuestions > 0 &&
                        currentQuestionIndex >= totalQuestions - 1
                            ? onNextQuestion
                            : undefined)
                    }
                />
            </div>
        </div>
    )
}
