import type { JSX } from "react"
import { Trophy } from "lucide-react"
import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { OptionStat } from "./HostGameQuestionStatistic.tsx"
import type { QuestionStatistics } from "@/hooks/useQuestionStatistics.ts"
import ProgressBar from "@/shadcn/components/ui/progress"

interface OrderQuestionStatisticViewProps {
    options: OptionStat[]
    questionStatistics?: QuestionStatistics | null
    totalAnswers: number
}

/**
 * Renders the results view for an "ORDER" type question.
 *
 * Displays the correct solution (order of the options) on the left side.
 * The right side shows how many players got the correct solution.
 * It also displays a list showing how many users correctly sorted each pair.
 */
export default function OrderQuestionStatisticView({
    options,
    questionStatistics,
    totalAnswers,
}: OrderQuestionStatisticViewProps): JSX.Element {
    const { t } = useTranslation()
    // total pairs = number of options - 1
    const totalPairs = options.length > 1 ? options.length - 1 : 0
    const orderStats =
        questionStatistics?.type === "ORDER" ? questionStatistics.answerStatistic : []
    // calculate the number of players who got the correct answer (100% correct answers)
    const correctPlayers = orderStats[totalPairs] ?? 0
    const correctPercentage =
        totalAnswers > 0 ? Math.round((correctPlayers / totalAnswers) * 100) : 0

    /**
     * Creates an array in descending order of pairs
     * E.g. if totalPairs is 3, it will create an array with 4 elements (3, 2, 1, 0)
     *
     * This object is used to map the correct PairCount to the number of votes and percentage.
     */
    const breakdownItems: { pairs: number; votes: number; percentage: number }[] = []
    for (let correctPairCount = totalPairs; correctPairCount >= 0; correctPairCount -= 1) {
        const votes = orderStats[correctPairCount] ?? 0
        const percentage = totalAnswers > 0 ? Math.round((votes / totalAnswers) * 100) : 0
        breakdownItems.push({ pairs: correctPairCount, votes, percentage })
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Correct Order column */}
            <div>
                <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                    {t("game.host.orderQuestion.correctOrder")}
                </h3>
                <ol className="flex flex-col gap-3">
                    {options.map((opt, i) => (
                        <li
                            key={opt.id}
                            className="border-border bg-muted/40 flex items-center gap-4 rounded-xl border px-5 py-3 text-base font-semibold"
                        >
                            <span className="h-6 w-6 shrink-0 text-center text-lg font-bold text-[#00D4E8]">
                                {i + 1}
                            </span>
                            <div className="[&_p]:m-0">
                                <ReactMarkdown
                                    unwrapDisallowed
                                    allowedElements={["p", "strong", "em", "code", "del", "s"]}
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {opt.text}
                                </ReactMarkdown>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Statistics column */}
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                        {t("game.host.orderQuestion.resultsBreakdown")}
                    </h3>
                    {/* Summary Card */}
                    <div className="flex items-center gap-4 rounded-2xl border border-[#00D4E8]/20 bg-[#00D4E8]/5 p-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00D4E8]/20">
                            <Trophy className="h-6 w-6 text-[#00D4E8]" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-[#00D4E8]">
                                {correctPercentage}%
                            </div>
                            <div className="text-muted-foreground text-sm font-medium">
                                {t("game.host.orderQuestion.correctStats", {
                                    count: correctPlayers,
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results by Pair */}
                <div className="flex flex-col gap-4">
                    {breakdownItems.map((item) => {
                        const isPerfect = item.pairs === totalPairs
                        return (
                            <div key={item.pairs} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-sm font-semibold">
                                    {/* Number of correctly ordered pairs */}
                                    <span
                                        className={isPerfect ? "text-[#00D4E8]" : "text-foreground"}
                                    >
                                        {isPerfect ? (
                                            <span>
                                                {t("game.host.orderQuestion.perfect", {
                                                    pairs: item.pairs,
                                                    total: totalPairs,
                                                })}
                                            </span>
                                        ) : (
                                            <span>
                                                {t("game.host.orderQuestion.pairsCorrect", {
                                                    pairs: item.pairs,
                                                    total: totalPairs,
                                                })}
                                            </span>
                                        )}
                                    </span>
                                    {/* Votes and percentage of votes */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            {t("game.host.orderQuestion.playerCount", {
                                                count: item.votes,
                                            })}
                                        </span>
                                        <span className="w-10 text-right font-bold">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                                <ProgressBar
                                    value={item.percentage}
                                    indicatorClassName={
                                        isPerfect ? "bg-[#00D4E8]" : "bg-muted-foreground/75"
                                    }
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
