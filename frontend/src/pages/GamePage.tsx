import type { JSX } from "react"
import { useEffect, useState } from "react"
import { useSocketEvent, useWebSocketContext } from "@/api/websocket"
import type { ServerEvents } from "@/api/websocket/types/serverEvents"
import QuestionContainer from "@/components/QuestionContainer"
import AnswerOption from "@/components/AnswerOption"
import { Button } from "@/shadcn/components/ui/button"

type DisplayQuestion = ServerEvents["displayQuestion"]

export default function GamePage(): JSX.Element {
    const websocket = useWebSocketContext()

    const [question, setQuestion] = useState<DisplayQuestion | null>(null)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
    const [answered, setAnswered] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useSocketEvent("displayQuestion", (payload) => {
        setQuestion(payload)
        setQuestionIndex((prev) => prev + 1)
        setSelectedAnswers([])
        setAnswered(false)
        setTimeLeft(payload.seconds)
    })

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return undefined
        const id = setTimeout(() => setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft])

    function onToggleAnswer(answer: string): void {
        if (answered) return
        if (question?.type === "SINGLE_CHOICE") {
            setSelectedAnswers([answer])
        } else {
            setSelectedAnswers((prev) =>
                prev.includes(answer) ? prev.filter((a) => a !== answer) : [...prev, answer]
            )
        }
    }

    function onSubmitAnswer(): void {
        if (answered || selectedAnswers.length === 0) return
        websocket.send({ command: "answerQuestion", payload: { answer: selectedAnswers } })
        setAnswered(true)
    }

    if (!question) {
        return (
            <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                <p className="text-muted-foreground text-sm">
                    Waiting for the host to show the first question…
                </p>
            </section>
        )
    }

    const options = question.options ?? []

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto flex max-w-md flex-col gap-6">
                <div className="flex items-center justify-between px-1">
                    <span className="text-muted-foreground text-sm font-bold">
                        Question {questionIndex}
                    </span>
                    {timeLeft !== null ? (
                        <span
                            className={`text-sm font-black ${timeLeft <= 5 ? "text-red-400" : "text-[#FF8A00]"}`}
                        >
                            {timeLeft > 0 ? `${timeLeft}s` : "Time's up!"}
                        </span>
                    ) : null}
                </div>

                <QuestionContainer question={question.question} />

                {question.type !== "SLIDE" && options.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {options.map((option, i) => (
                                <AnswerOption
                                    key={option.answer}
                                    index={i}
                                    isSelected={selectedAnswers.includes(option.answer)}
                                    onSelect={() => onToggleAnswer(option.answer)}
                                    text={option.answer}
                                />
                            ))}
                        </div>

                        {answered ? (
                            <p className="text-muted-foreground text-center text-sm font-medium">
                                Answer submitted — waiting for results…
                            </p>
                        ) : (
                            <Button
                                className="w-full rounded-xl"
                                disabled={selectedAnswers.length === 0}
                                onClick={() => onSubmitAnswer()}
                                type="button"
                            >
                                Submit Answer
                            </Button>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    )
}
