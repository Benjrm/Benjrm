import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import OrderQuestionStatisticView from "./OrderQuestionStatisticView.tsx"
import ChoiceQuestionStatisticView from "./ChoiceQuestionStatisticView.tsx"
import type { QuestionType } from "@/api/questions/questions.types.ts"
import type { QuestionStatistics } from "@/hooks/useQuestionStatistics.ts"
import Badge from "@/shadcn/components/ui/badge"

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
    const { t } = useTranslation()
    return (
        <div className="flex h-full flex-col justify-between">
            <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                        {t("game.host.results")}
                    </span>
                    <Badge variant="secondary" className="px-4 py-3 text-sm">
                        {t("game.host.answeredCount", {
                            count: totalAnswers,
                            total: expectedAnswers,
                        })}
                    </Badge>
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
