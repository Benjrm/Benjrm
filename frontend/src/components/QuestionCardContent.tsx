// frontend/src/components/QuestionCardContent.tsx

import type { JSX } from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { QuestionTypeEnum } from "@/api/questions/types/questionType"
import type { QuestionType } from "@/api/questions/types/questionType"
import QuestionHeader from "@/components/QuestionHeader"
import QuestionContainer from "@/components/QuestionContainer"
import AnswerOption from "@/components/AnswerOption"
import TimerBar from "@/components/TimerBar"
import { Button } from "@/shadcn/components/ui/button"

export interface QuestionOption {
    id: string
    text: string
}

export interface QuestionCardContentProps {
    questionText: string
    options: QuestionOption[]
    secondsToAnswer: number | null
    questionExpiresAt?: number | null
    playerName?: string
    playerEmoji?: string
    isHost: boolean
    currentQuestionIndex: number
    totalQuestions: number
    onSendAnswer?: (id: string | string[]) => void
    onNextQuestion?: () => void
    type?: QuestionType
}

export default function QuestionCardContent({
    questionText,
    options,
    secondsToAnswer,
    questionExpiresAt,
    playerName,
    playerEmoji,
    isHost,
    currentQuestionIndex,
    totalQuestions,
    onSendAnswer,
    onNextQuestion,
    type,
}: QuestionCardContentProps): JSX.Element {
    const { t } = useTranslation()
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
    const [timeLeft, setTimeLeft] = useState<number | null>(() => {
        if (questionExpiresAt)
            return Math.max(0, Math.ceil((questionExpiresAt - Date.now()) / 1000))
        return secondsToAnswer
    })
    const [hasSubmitted, setHasSubmitted] = useState(false)

    useEffect(() => {
        const expiresAt =
            questionExpiresAt ?? (secondsToAnswer ? Date.now() + secondsToAnswer * 1000 : null)
        if (expiresAt === null) return undefined
        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
            setTimeLeft(remaining)
            if (remaining <= 0) clearInterval(timer)
        }, 500)
        return (): void => {
            clearInterval(timer)
        }
    }, [questionExpiresAt, secondsToAnswer])

    // Automatisches Absenden, wenn die Zeit bei 0 ankommt
    useEffect(() => {
        if (timeLeft === 0 && !hasSubmitted && !isHost) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasSubmitted(true)
            if (onSendAnswer) onSendAnswer(selectedAnswers)
        }
    }, [timeLeft, hasSubmitted, isHost, selectedAnswers, onSendAnswer])

    const handleSelect = (id: string) => {
        if (isHost || hasSubmitted) return

        if (type === QuestionTypeEnum.MULTIPLE_CHOICE) {
            setSelectedAnswers((prev) =>
                prev.includes(id) ? prev.filter((val) => val !== id) : [...prev, id]
            )
        } else {
            setSelectedAnswers([id])
        }
    }

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto flex max-w-md flex-col gap-6">
                <QuestionHeader
                    currentQuestion={currentQuestionIndex + 1}
                    playerEmoji={playerEmoji}
                    remainingTime={timeLeft}
                    totalQuestions={totalQuestions}
                    playerName={
                        playerName ?? (isHost ? t("game.player.host") : t("game.player.player"))
                    }
                />

                <TimerBar timeLeft={timeLeft} totalSeconds={secondsToAnswer} />

                <QuestionContainer question={questionText} />

                <div className="grid grid-cols-2 gap-4">
                    {options.map((option, i) => (
                        <AnswerOption
                            key={option.id}
                            index={i}
                            isSelected={selectedAnswers.includes(option.id)}
                            onSelect={() => handleSelect(option.id)}
                            text={option.text}
                        />
                    ))}
                </div>

                {!isHost ? (
                    <div className="mt-6 flex justify-center">
                        <Button
                            className="bg-[#00D4E8] px-8 py-6 text-lg font-bold text-black hover:bg-[#00BDD0] disabled:bg-gray-600 disabled:text-gray-300"
                            disabled={hasSubmitted || selectedAnswers.length === 0}
                            onClick={() => {
                                setHasSubmitted(true)
                                if (onSendAnswer) onSendAnswer(selectedAnswers)
                            }}
                        >
                            {hasSubmitted ? t("game.answer.sent") : t("game.answer.submit")}
                        </Button>
                    </div>
                ) : null}

                {isHost && onNextQuestion ? (
                    <div className="mt-8 flex justify-center">
                        <Button
                            className="bg-[#00D4E8] font-bold text-black hover:bg-[#00BDD0]"
                            onClick={onNextQuestion}
                        >
                            {t("game.question.skipNext")}
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
