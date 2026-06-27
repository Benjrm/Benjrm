import type { JSX } from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { Toaster } from "sonner"
import QuestionCardContent from "@/components/QuestionCardContent"
import InfoSlideContent from "@/components/InfoSlideContent"
import OrderQuestionContent from "@/components/OrderQuestionContent"
import MarkdownComponent from "@/components/markdown/MarkdownComponent"
import LeaderboardAnimationScreen from "@/components/LeaderboardAnimationScreen"
import { GameStateEnum } from "@/hooks/useGameSession"
import type {
    GameState,
    GameQuestion,
    QuestionResult,
    LeaderboardEntry,
} from "@/hooks/useGameSession"

const PREVIEW_DURATION_MS = 2500

function QuestionPreview({ question }: { question: { text: string } }): JSX.Element {
    const [width, setWidth] = useState(100)

    useEffect(() => {
        const raf = requestAnimationFrame(() => setWidth(0))
        return () => cancelAnimationFrame(raf)
    }, [])

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 px-6 text-center">
            <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
                Get ready!
            </p>
            <div className="bg-card text-card-foreground w-full max-w-xl rounded-2xl border px-8 py-10 shadow-lg">
                <div className="text-3xl font-extrabold sm:text-4xl [&_p]:m-0 [&_p]:text-3xl [&_p]:font-extrabold sm:[&_p]:text-4xl">
                    <MarkdownComponent content={question.text} />
                </div>
            </div>
            <div className="bg-muted/50 w-full max-w-xl overflow-hidden rounded-full">
                <div
                    className="h-2 rounded-full bg-[#00D4E8]"
                    style={{
                        width: `${width}%`,
                        transition: `width ${PREVIEW_DURATION_MS}ms linear`,
                    }}
                />
            </div>
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
    playerEmoji: string | undefined
    playerItemOrder: string[] | null
    hasSubmittedAnswer?: boolean
    initialSelectedAnswers?: string[]
    skipPreview?: boolean
    onNextQuestion: () => void
    onSendAnswer: (answer: string | string[]) => void
    onItemOrderChange: (ids: string[]) => void
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
    playerEmoji,
    playerItemOrder,
    hasSubmittedAnswer = false,
    initialSelectedAnswers = [],
    skipPreview = false,
    onNextQuestion,
    onSendAnswer,
    onItemOrderChange,
}: GameScreenProps): JSX.Element {
    const navigate = useNavigate()
    const [showingPreview, setShowingPreview] = useState(false)
    const prevQuestionIndexRef = useRef(currentQuestionIndex)

    useEffect(() => {
        if (
            gameState === GameStateEnum.QUESTION &&
            currentQuestion &&
            currentQuestion.type !== "SLIDE" &&
            currentQuestionIndex !== prevQuestionIndexRef.current
        ) {
            prevQuestionIndexRef.current = currentQuestionIndex

            if (skipPreview) return undefined

            const showTimer = setTimeout(() => setShowingPreview(true), 0)
            const hideTimer = setTimeout(() => setShowingPreview(false), PREVIEW_DURATION_MS)
            return () => {
                clearTimeout(showTimer)
                clearTimeout(hideTimer)
            }
        }
        return undefined
    }, [gameState, currentQuestion, currentQuestionIndex, questionExpiresAt, skipPreview])

    function renderContent(): JSX.Element | null {
        if (gameState === GameStateEnum.LEADERBOARD && leaderboard) {
            return (
                <LeaderboardAnimationScreen
                    isFinal={isFinalLeaderboard}
                    leaderboard={leaderboard}
                    onLeave={async () => navigate("/")}
                />
            )
        }

        if (showingPreview && currentQuestion) {
            return <QuestionPreview question={currentQuestion} />
        }
        if (gameState === GameStateEnum.PLAYING) {
            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                    <h2 className="text-2xl font-bold text-white">Game is starting...</h2>
                    <p className="text-muted-foreground">Get ready!</p>
                </div>
            )
        }

        if (gameState === GameStateEnum.QUESTION && currentQuestion) {
            if (currentQuestion.type === "SLIDE") {
                return (
                    <InfoSlideContent
                        key={currentQuestion.id}
                        content={currentQuestion.text}
                        currentSlide={currentQuestionIndex + 1}
                        isHost={false}
                        onNextQuestion={onNextQuestion}
                        playerEmoji={playerEmoji}
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
                        initialHasAnswered={hasSubmittedAnswer}
                        initialItemOrder={playerItemOrder ?? undefined}
                        isHost={false}
                        onItemOrderChange={onItemOrderChange}
                        onNextQuestion={onNextQuestion}
                        onSendAnswer={(ids) => onSendAnswer(ids)}
                        options={currentQuestion.options}
                        playerEmoji={playerEmoji}
                        playerName={playerName}
                        questionExpiresAt={questionExpiresAt}
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
                    initialHasSubmitted={hasSubmittedAnswer}
                    initialSelectedAnswers={initialSelectedAnswers}
                    isHost={false}
                    onNextQuestion={onNextQuestion}
                    onSendAnswer={onSendAnswer}
                    options={currentQuestion.options}
                    playerEmoji={playerEmoji}
                    playerName={playerName}
                    questionExpiresAt={questionExpiresAt}
                    questionText={currentQuestion.text}
                    secondsToAnswer={currentQuestion.seconds}
                    totalQuestions={totalQuestions}
                    type={currentQuestion.type}
                />
            )
        }

        if (gameState === GameStateEnum.RESULT && questionResult) {
            const correct = questionResult.points > 0
            return (
                <div className="text-foreground flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
                    <div
                        className={`rounded-full p-6 text-5xl ${correct ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                    >
                        {correct ? "✓" : "✗"}
                    </div>
                    <h2 className="text-3xl font-bold">{correct ? "Correct!" : "Wrong!"}</h2>
                    <p className="text-xl">+{questionResult.points} points</p>
                    <p className="text-muted-foreground">Total: {questionResult.totalPoints}</p>
                    <p className="text-muted-foreground mt-8 text-sm">
                        Waiting for the host to continue...
                    </p>
                </div>
            )
        }

        return null
    }

    return (
        <>
            <Toaster richColors />
            {renderContent()}
        </>
    )
}
