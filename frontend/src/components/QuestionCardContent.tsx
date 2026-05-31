// frontend/src/compontents/QuestionCardContent.tsx

import type { JSX } from "react"
import { useState } from "react"
import { toast } from "sonner"
import QuestionHeader from "@/components/QuestionHeader"
import QuestionContainer from "@/components/QuestionContainer"
import AnswerOption from "@/components/AnswerOption"

const ICONS = ["▲", "◆", "●", "■", "◯", "◆"]
const COLORS = ["#2d4cc9", "#ffa602", "#11c8d4", "#ff4949", "#28c28b", "#8b5cf6"]

export default function QuestionCardContent(): JSX.Element {
    const remainingTime = 12

    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

    const sendAnswer = (id: string) => {
        setSelectedAnswer(id)

        toast.success("Answer Submitted", {
            description: `Mock data recorded for: ${id}`,
            duration: 2000,
        })
    }

    const question = {
        question: "Why did the developer go broke?",
        options: [
            { id: "opt_1", text: "Because they used up all their cache" },
            { id: "opt_2", text: "Because Docker ate their wallet" },
            { id: "opt_3", text: "Too many unhandled promises" },
            { id: "opt_4", text: "They bought a mechanical keyboard" },
        ],
    }

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto flex max-w-md flex-col gap-6">
                <QuestionHeader
                    currentQuestion={1}
                    playerName="Funny Crocodile"
                    remainingTime={remainingTime}
                    totalQuestions={10}
                />

                <QuestionContainer question={question?.question} />

                <div className="grid grid-cols-2 gap-4">
                    {question?.options?.map((option, i) => (
                        <AnswerOption
                            key={option.id}
                            color={COLORS[i % COLORS.length]}
                            icon={ICONS[i % ICONS.length]}
                            index={i}
                            isSelected={selectedAnswer === option.id}
                            onSelect={() => sendAnswer(option.id)}
                            text={option.text}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
