import type { JSX } from "react"
import type { Answer } from "@/types/quiz"

interface QuestionPanelProps {
    question: string
    answered: number
    total: number
    answers: Answer[]
}

const ANSWER_COLORS = [
    { color: "#2d4cc9", icon: "▲" },
    { color: "#ffa602", icon: "◆" },
    { color: "#11c8d4", icon: "●" },
    { color: "#ff4949", icon: "■" },
]

export default function QuestionPanel({
    question,
    answered,
    total,
    answers,
}: QuestionPanelProps): JSX.Element {
    return (
        <div className="bg-muted/20 border-border/10 relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-[#FF8A00]/8 blur-3xl" />

            <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    Current Question
                </h3>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold tracking-tight text-[#FF8A00] shadow-[0_0_15px_rgba(255,138,0,0.2)]">
                    3 Secs left
                </div>
            </div>

            <div className="my-10">
                <p className="max-w-3xl text-3xl leading-tight font-black tracking-tight wrap-break-word sm:text-4xl">
                    {question}
                </p>
            </div>

            {/* Answer Options */}
            <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {answers.map((answer, idx) => {
                    const { color, icon } = ANSWER_COLORS[idx] || ANSWER_COLORS[0]
                    return (
                        <div
                            key={answer.id}
                            className="bg-muted/30 relative flex flex-col items-center justify-center gap-4 overflow-visible rounded-2xl border-2 p-8 text-center shadow-sm backdrop-blur-lg transition-all duration-300"
                            style={{
                                borderColor: "rgba(255,255,255,0.08)",
                            }}
                        >
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-black text-white shadow-md"
                                style={{ background: color }}
                            >
                                {icon}
                            </div>

                            <div className="text-base font-bold">{answer.text}</div>
                        </div>
                    )
                })}
            </div>

            {/* Progress Bar Section */}
            <div className="mt-6 border-t border-white/5 pt-6">
                <div className="text-muted-foreground flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="h-5 w-5 animate-spin text-[#00F2FF]" viewBox="0 0 24 24">
                            <circle
                                cx="12"
                                cy="12"
                                fill="none"
                                r="10"
                                stroke="currentColor"
                                strokeDasharray="45"
                                strokeDashoffset="0"
                                strokeWidth="3.5"
                            />
                        </svg>
                        <span className="text-foreground/90 text-base font-medium">
                            Waiting for answers...
                        </span>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-2xl font-black tracking-tight">
                            {answered} / {total}
                        </span>
                        <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-white/5 sm:block">
                            <div
                                className="h-full bg-[#00F2FF] shadow-[0_0_10px_rgba(0,242,255,0.5)] transition-all duration-300"
                                style={{ width: `${(answered / total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
