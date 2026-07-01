import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import OrderQuestionStatisticView from "./OrderQuestionStatisticView.tsx"
import ChoiceQuestionStatisticView from "./ChoiceQuestionStatisticView.tsx"
import MarkdownComponent from "@/shared/views/markdown/MarkdownComponent"
import type { QuestionType } from "@/features/question/types/questions.ts"

import { Badge } from "@/shadcn/components/ui/badge"
import type { OptionStat, QuestionStatistics } from "@/features/question/types/statistics.ts"

interface HostGameQuestionStatisticProps {
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
                    <Badge className="px-4 py-3 text-sm" variant="secondary">
                        {t("game.host.answeredCount", {
                            count: totalAnswers,
                            total: expectedAnswers,
                        })}
                    </Badge>
                </div>

                {/* Question */}
                <h2 className="mb-10 text-2xl leading-snug font-bold sm:text-3xl">
                    <MarkdownComponent content={questionText} />
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
