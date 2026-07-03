import type { JSX } from "react"
import { Triangle, Diamond, Circle, Square, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ProgressBar from "@/shadcn/components/ui/progress"
import type { StatisticOption } from "@/features/question/types/statistics.ts"

interface ChoiceQuestionStatisticViewProps {
    options: StatisticOption[]
    totalAnswers: number
}

const OPTION_COLORS = [
    {
        bg: "bg-[#2d4cc9]",
        progress: "bg-[#2d4cc9]",
        icon: Triangle,
    },
    {
        bg: "bg-[#ffa602]",
        progress: "bg-[#ffa602]",
        icon: Diamond,
    },
    {
        bg: "bg-[#11c8d4]",
        progress: "bg-[#11c8d4]",
        icon: Circle,
    },
    {
        bg: "bg-[#ff4949]",
        progress: "bg-[#ff4949]",
        icon: Square,
    },
]

/**
 * Renders the results view for "SINGLE_CHOICE" and "MULTIPLE_CHOICE" type questions.
 *
 * Displays a list of answer options with progress bars corresponding to the percentage of votes
 * each option received, along with correctness checkmarks.
 *
 * @param options - The list of options with their respective text, votes, and whether they are correct.
 * @param totalAnswers - The total number of players who submitted an answer.
 * @returns The ChoiceQuestionStatisticView component.
 */
export default function ChoiceQuestionStatisticView({
    options,
    totalAnswers,
}: Readonly<ChoiceQuestionStatisticViewProps>): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col gap-6">
            {options.map((opt, i) => {
                const style = OPTION_COLORS[i] ?? OPTION_COLORS[0]
                const Icon = style.icon
                const percentage =
                    totalAnswers > 0 ? Math.round((opt.votes / totalAnswers) * 100) : 0

                return (
                    <div key={opt.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg}`}
                            >
                                <Icon className="h-6 w-6 stroke-[2.5] text-white" />
                            </div>
                            <div className="flex-1 text-lg leading-tight font-semibold">
                                <ReactMarkdown
                                    unwrapDisallowed
                                    allowedElements={["p", "strong", "em", "code", "del", "s"]}
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {opt.text}
                                </ReactMarkdown>
                            </div>
                            {opt.isCorrect ? (
                                <Check className="h-6 w-6 shrink-0 stroke-[3] text-[#00D4E8]" />
                            ) : null}
                            <div className="text-muted-foreground w-20 text-right text-sm font-medium">
                                {t("game.host.choiceQuestion.voteCount", { count: opt.votes })}
                            </div>
                            <div
                                className={`w-12 text-right text-lg font-bold ${opt.isCorrect ? "text-[#00D4E8]" : "text-muted-foreground"}`}
                            >
                                {percentage}%
                            </div>
                        </div>
                        <ProgressBar indicatorClassName={style.progress} value={percentage} />
                    </div>
                )
            })}
        </div>
    )
}
