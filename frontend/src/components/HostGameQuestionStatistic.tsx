import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import OrderQuestionStatisticView from "./OrderQuestionStatisticView.tsx"
import ChoiceQuestionStatisticView from "./ChoiceQuestionStatisticView.tsx"
import type { QuestionType } from "@/api/questions/questions.types.ts"
import type { QuestionStatistics } from "@/hooks/useQuestionStatistics.ts"

export interface OptionStat {
    id: string
    text: string
    votes: number
    isCorrect: boolean
}

export interface HostGameQuestionStatisticProps {
    questionText: string
    options: OptionStat[]
    totalAnswers: number
    expectedAnswers: number
    currentQuestionIndex: number
    totalQuestions: number
    questionType?: QuestionType
    questionStatistics?: QuestionStatistics | null
}

export default function HostGameQuestionStatistic({
    questionText,
    options,
    totalAnswers,
    expectedAnswers,
    currentQuestionIndex,
    totalQuestions,
    questionType,
    questionStatistics,
}: HostGameQuestionStatisticProps): JSX.Element {
    const { t } = useTranslation("translation")
    return (
        <div className="flex h-full flex-col justify-between">
            <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                        {t("game.host.results")}
                    </span>
                    <div className="bg-muted/50 rounded-full px-4 py-1 text-sm font-medium">
                        {t("game.host.answeredCount", {
                            count: totalAnswers,
                            total: expectedAnswers,
                        })}
                    </div>
                </div>

                {/* Question */}
                <h2 className="mb-10 text-2xl leading-snug font-bold sm:text-3xl">
                    {questionText}
                </h2>

                {/* Statistics Content */}
                {questionType === "ORDER" ? (
                    <OrderQuestionStatisticView
                        options={options}
                        questionStatistics={questionStatistics}
                        totalAnswers={totalAnswers}
                    />
                ) : (
                    <ChoiceQuestionStatisticView options={options} totalAnswers={totalAnswers} />
                )}
            </div>

            {/* Footer */}
            <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
                <span className="text-muted-foreground text-sm font-medium">
                    {t("game.question.progress")}
                </span>
                <span className="text-lg font-bold">
                    {currentQuestionIndex + 1} / {totalQuestions}
                </span>
            </div>
        </div>
    )
}
