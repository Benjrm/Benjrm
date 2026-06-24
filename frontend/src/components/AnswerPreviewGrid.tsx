import type { JSX } from "react"
import getAnswerVisuals from "../utils/answerVisuals"
import type { QuestionOption, QuestionType } from "@/api/questions/questions.types.ts"

interface Props {
    options: QuestionOption[]
    type: QuestionType
}

export default function AnswerPreviewGrid({ options, type }: Props): JSX.Element {
    if (type === "ORDER") {
        return (
            <div className="space-y-3">
                {options.map((option, index) => (
                    <div
                        key={option.id}
                        className="bg-card text-card-foreground border-border/60 flex items-center gap-3 rounded-[1rem] border px-4 py-4 shadow-sm transition-colors"
                    >
                        <div
                            aria-hidden="true"
                            className="text-muted-foreground/70 -mx-1 flex items-center self-stretch px-1 py-1"
                        >
                            <span className="bg-muted/60 text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-[11px]">
                                ⋮⋮
                            </span>
                        </div>

                        <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black shadow-inner">
                            {index + 1}
                        </div>

                        <span className="text-card-foreground text-[15px] font-bold tracking-tight">
                            {option.answer || `Item ${index + 1}`}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            {options.map((option, index) => {
                const visuals = getAnswerVisuals(index)
                const isCorrect = Boolean((option as { correct?: boolean }).correct)

                return (
                    <div
                        key={option.id}
                        className={`group relative flex min-h-28 flex-col items-center justify-center overflow-hidden rounded-[1rem] border p-3 text-center shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            isCorrect
                                ? "border-emerald-400/60 bg-emerald-50 dark:bg-emerald-500/10"
                                : "border-black/5 bg-white/90 dark:border-white/5 dark:bg-white/5"
                        }`}
                    >
                        <div
                            className={`absolute inset-0 blur-2xl transition-opacity duration-300 group-hover:opacity-35 ${
                                isCorrect ? "opacity-25" : "opacity-15"
                            }`}
                            style={{
                                background: isCorrect
                                    ? "radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)"
                                    : visuals.glow,
                            }}
                        />

                        <span
                            className="relative z-10 mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg"
                            style={{
                                background: isCorrect ? "#22c55e" : visuals.accent,
                            }}
                        >
                            {visuals.icon}
                        </span>

                        <span className="relative z-10 line-clamp-2 text-[11px] leading-4 font-semibold text-slate-700 dark:text-white">
                            {option.answer || "Answer"}
                        </span>

                        {isCorrect ? (
                            <span className="relative z-10 mt-2 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold tracking-[0.2em] text-emerald-700 uppercase dark:text-emerald-200">
                                Correct
                            </span>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}
