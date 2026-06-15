import type { JSX } from "react"
import type { Answer } from "@/types/quiz"

interface QuestionPanelProps {
    question: string
    currentQuestion: number
    totalQuestions: number
    answers: Answer[]
    timeLeft: number | null
}

const ANSWER_COLORS = [
    { color: "#2d4cc9", icon: "▲" },
    { color: "#ffa602", icon: "◆" },
    { color: "#11c8d4", icon: "●" },
    { color: "#ff4949", icon: "■" },
]

export default function QuestionPanel({
    question,
    currentQuestion,
    totalQuestions,
    answers,
    timeLeft,
}: QuestionPanelProps): JSX.Element {
    return (
        <div className="bg-muted/20 border-border/10 relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-[#FF8A00]/8 blur-3xl" />

            <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    Current Question
                </h3>
                {timeLeft !== null ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold tracking-tight text-[#FF8A00] shadow-[0_0_15px_rgba(255,138,0,0.2)]">
                        {timeLeft > 0 ? `${timeLeft}s left` : "Time's up!"}
                    </div>
                ) : null}
            </div>

            <div className="my-10">
                <p className="max-w-3xl text-3xl leading-tight font-black tracking-tight wrap-break-word sm:text-4xl">
                    {question || "Waiting for next question…"}
                </p>
            </div>

            <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {answers.map((answer, idx) => {
                    const { color, icon } = ANSWER_COLORS[idx] ?? ANSWER_COLORS[0]
                    return (
                        <div
                            key={answer.id}
                            className="bg-muted/30 relative flex flex-col items-center justify-center gap-4 overflow-visible rounded-2xl border-2 p-8 text-center shadow-sm backdrop-blur-lg transition-all duration-300"
                            style={{ borderColor: "rgba(255,255,255,0.08)" }}
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

            <div className="mt-6 border-t border-white/5 pt-6">
                <div className="text-muted-foreground flex items-center justify-between">
                    <span className="text-sm font-medium">Question progress</span>
                    <span className="text-2xl font-black tracking-tight">
                        {currentQuestion}
                        {totalQuestions > 0 ? ` / ${totalQuestions}` : ""}
                    </span>
                </div>
            </div>
        </div>
    )
}
