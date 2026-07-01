import type { JSX } from "react"
import ReactMarkdown from "react-markdown"
import { useTranslation } from "react-i18next"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import markdownComponents from "@/shared/views/markdown/markdownComponents"
import sanitizeSchema from "@/shared/views/markdown/sanitizeSchema"
import CountdownDisplay from "@/features/question/views/CountdownDisplay"
import type { QuestionType } from "@/features/question/types/questions.types.ts"

const ANSWER_COLORS = [
    { color: "#2d4cc9", icon: "▲" },
    { color: "#ffa602", icon: "◆" },
    { color: "#11c8d4", icon: "●" },
    { color: "#ff4949", icon: "■" },
] as const

interface QuestionPanelProps {
    question: string
    currentQuestion: number
    totalQuestions: number
    options?: { answer: string }[]
    questionType?: QuestionType | null
    timeLeft: number | null
}

export default function QuestionPanel({
    question,
    currentQuestion,
    totalQuestions,
    options,
    questionType,
    timeLeft,
}: QuestionPanelProps): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="bg-muted/20 border-border/10 relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-[#FF8A00]/8 blur-3xl" />

            <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    {t("game.question.currentLabel")}
                </h3>
                <CountdownDisplay timeLeft={timeLeft} variant="host" />
            </div>

            <div className="my-10 max-w-3xl [&_h1]:text-3xl [&_h1]:font-black sm:[&_h1]:text-4xl [&_h2]:text-2xl [&_h2]:font-black [&_p]:text-3xl [&_p]:leading-tight [&_p]:font-black [&_p]:tracking-tight sm:[&_p]:text-4xl [&_strong]:text-white">
                <ReactMarkdown
                    components={markdownComponents}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                    remarkPlugins={[remarkGfm]}
                >
                    {question || t("game.question.waitingForNext")}
                </ReactMarkdown>
            </div>

            {questionType === "ORDER" && options ? (
                <ol className="my-8 flex flex-col gap-3">
                    {options.map((opt, idx) => (
                        <li
                            key={opt.answer}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-lg"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black">
                                {idx + 1}
                            </span>
                            <span className="text-base font-bold">{opt.answer}</span>
                        </li>
                    ))}
                </ol>
            ) : null}

            {questionType !== "ORDER" && options && options.length > 0 ? (
                <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {options.map((opt, idx) => {
                        const { color, icon } = ANSWER_COLORS[idx] ?? ANSWER_COLORS[0]
                        return (
                            <div
                                key={opt.answer}
                                className="bg-muted/30 relative flex flex-col items-center justify-center gap-4 overflow-visible rounded-2xl border-2 p-8 text-center shadow-sm backdrop-blur-lg transition-all duration-300"
                                style={{ borderColor: "rgba(255,255,255,0.08)" }}
                            >
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-black text-white shadow-md"
                                    style={{ background: color }}
                                >
                                    {icon}
                                </div>
                                <div className="text-base font-bold">{opt.answer}</div>
                            </div>
                        )
                    })}
                </div>
            ) : null}

            <div className="mt-6 border-t border-white/5 pt-6">
                <div className="text-muted-foreground flex items-center justify-between">
                    <span className="text-sm font-medium">{t("game.question.progress")}</span>
                    <span className="text-2xl font-black tracking-tight">
                        {currentQuestion}
                        {totalQuestions > 0 ? ` / ${totalQuestions}` : ""}
                    </span>
                </div>
            </div>
        </div>
    )
}
