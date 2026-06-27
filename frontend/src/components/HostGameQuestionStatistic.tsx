import type { JSX } from "react"
import { Triangle, Diamond, Circle, Square, Check } from "lucide-react"
import type { QuestionType } from "@/api/questions/questions.types.ts"

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

export default function HostGameQuestionStatistic({
    questionText,
    options,
    totalAnswers,
    expectedAnswers,
    currentQuestionIndex,
    totalQuestions,
    questionType,
}: HostGameQuestionStatisticProps): JSX.Element {
    return (
        <div className="flex h-full flex-col justify-between">
            <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                        Results
                    </span>
                    <div className="bg-muted/50 rounded-full px-4 py-1 text-sm font-medium">
                        {totalAnswers}/{expectedAnswers} answered
                    </div>
                </div>

                {/* Question */}
                <h2 className="mb-10 text-2xl leading-snug font-bold sm:text-3xl">
                    {questionText}
                </h2>

                {/* ORDERED List */}
                {questionType === "ORDER" ? (
                    <ol className="flex flex-col gap-4">
                        {options.map((opt, i) => (
                            <li
                                key={opt.id}
                                className="border-border bg-muted/40 flex items-center gap-4 rounded-xl border px-6 py-4 text-lg font-semibold"
                            >
                                <span className="text-[#00D4E8] w-6 h-6 shrink-0 text-center text-xl font-bold">
                                    {i + 1}
                                </span>
                                {opt.text}
                            </li>
                        ))}
                    </ol>
                ) : (
                    /* Statistics List */
                    <div className="flex flex-col gap-6">
                        {options.map((opt, i) => {
                            const style = OPTION_COLORS[i] ?? OPTION_COLORS[0]
                            const Icon = style.icon
                            const percentage =
                                expectedAnswers > 0
                                    ? Math.round((opt.votes / expectedAnswers) * 100)
                                    : 0

                            return (
                                <div key={opt.id} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg}`}
                                        >
                                            <Icon className="h-6 w-6 stroke-[2.5] text-white" />
                                        </div>
                                        <div className="flex-1 text-lg leading-tight font-semibold">
                                            {opt.text}
                                        </div>
                                        {opt.isCorrect ? (
                                            <Check className="h-6 w-6 shrink-0 stroke-[3] text-[#00D4E8]" />
                                        ) : null}
                                        <div className="text-muted-foreground w-20 text-right text-sm font-medium">
                                            {opt.votes} vote{opt.votes !== 1 ? "s" : ""}
                                        </div>
                                        <div
                                            className={`w-12 text-right text-lg font-bold ${opt.isCorrect ? "text-[#00D4E8]" : "text-muted-foreground"}`}
                                        >
                                            {percentage}%
                                        </div>
                                    </div>
                                    <div className="bg-muted/40 h-2.5 w-full overflow-hidden rounded-full">
                                        <div
                                            className={`h-full rounded-full ${style.progress}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
                <span className="text-muted-foreground text-sm font-medium">Question progress</span>
                <span className="text-lg font-bold">
                    {currentQuestionIndex + 1} / {totalQuestions}
                </span>
            </div>
        </div>
    )
}
