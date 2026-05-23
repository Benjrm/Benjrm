// frontend/src/pages/SingleChoiceQuestion.tsx

import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router"
import { toast } from "sonner"
import { useQuiz } from "@/api/queries"

interface PlayQuestion {
    id: number
    title: string
    options: string[]
}

const ICONS = ["▲", "◆", "●", "■", "◯", "◆"]
const COLORS = ["#2d4cc9", "#ffa602", "#11c8d4", "#ff4949", "#28c28b", "#8b5cf6"]

async function submitAnswer(quizId: string, questionId: number, answerIndex: number) {
    const url = `/api/v1/quizzes/${quizId}/submit`
    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answerIndex }),
    })
}

export default function SingleChoiceQuestion(): JSX.Element {
    const { quizId } = useParams()
    const { data: quiz } = useQuiz(quizId)

    const defaultQuestion: PlayQuestion = useMemo(
        () => ({
            id: 1,
            title: quiz?.title ?? "Sample question?",
            options: ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
        }),
        [quiz]
    )

    const question = defaultQuestion
    const [selected, setSelected] = useState<number | null>(null)

    useEffect(() => {
        // If backend later provides a play endpoint, fetch the live question here.
    }, [quizId])

    const progress = 3
    const total = 27

    const handleSelect = async (index: number) => {
        setSelected(index)

        try {
            if (quizId) {
                await submitAnswer(quizId, question.id, index)
            }
        } catch {
            toast.error("Uh oh!", {
                description: "Failed to save your answer. Please try again.",
            })
        }
    }

    const options = question.options.slice(0, 6)
    const optionsToShow =
        options.length >= 2 ? options : [...options, ...Array(2 - options.length).fill("")]

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto max-w-md">
                <div className="mb-6 flex items-center justify-center">
                    <div className="bg-muted/40 rounded-full px-4 py-2 text-sm font-bold">
                        Funny Crocodile
                    </div>
                </div>

                <div className="bg-muted/30 relative overflow-hidden rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground text-xs">&nbsp;</div>
                        <div className="text-sm font-bold">
                            {progress} / {total}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-3">
                        <h2 className="text-center text-xl font-extrabold">{question.title}</h2>

                        <div className="bg-muted/40 h-2 w-full rounded-full">
                            <div
                                className="h-full rounded-full bg-[#00F2FF] transition-all"
                                style={{ width: `${(progress / total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    {Array.from(optionsToShow.entries()).map(([i, opt]) => (
                        <button
                            key={`${question.id}-option-${i}`}
                            aria-pressed={selected === i}
                            onClick={async () => handleSelect(i)}
                            type="button"
                            className={`border-border/20 bg-muted/30 relative flex flex-col items-center justify-center gap-4 overflow-visible rounded-2xl border p-8 text-center backdrop-blur-lg transition-all duration-300 ease-out ${
                                selected === i
                                    ? "scale-[1.01] shadow-[0_0_60px_var(--glow-color)] ring-2 ring-offset-2"
                                    : "hover:scale-[1.01] hover:shadow-[0_0_60px_var(--glow-color)]"
                            }`}
                            style={
                                {
                                    "--glow-color": COLORS[i % COLORS.length],
                                } as React.CSSProperties
                            }
                        >
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-black text-white shadow-md"
                                style={{ background: COLORS[i % COLORS.length] }}
                            >
                                {ICONS[i % ICONS.length]}
                            </div>

                            <div className="text-base font-bold">{opt ?? `Option ${i + 1}`}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
