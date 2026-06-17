import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    closestCorners,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useWebSocketContext } from "@/api/websocket"
import useDisplayQuestion from "@/hooks/useDisplayQuestion"
import CountdownDisplay from "@/components/CountdownDisplay"
import QuestionContainer from "@/components/QuestionContainer"
import AnswerOption from "@/components/AnswerOption"
import SortableOrderOption from "@/components/SortableOrderOption"
import { Button } from "@/shadcn/components/ui/button"

interface OrderItem {
    id: string
    label: string
}

export default function GamePage(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const navigate = useNavigate()

    const gameActive = code !== undefined && sessionStorage.getItem(`gameActive:${code}`) === "1"

    useEffect(() => {
        if (!gameActive) {
            navigate(`/play/${codeParam ?? ""}`, { replace: true })
        }
    }, [gameActive, navigate, codeParam])

    const websocket = useWebSocketContext()

    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
    const [orderItems, setOrderItems] = useState<OrderItem[]>([])
    const [answered, setAnswered] = useState(false)

    const { question, questionIndex, timeLeft } = useDisplayQuestion(
        useCallback((payload) => {
            setSelectedAnswers([])
            setAnswered(false)
            if (payload.type === "ORDER") {
                setOrderItems(
                    (payload.options ?? []).map((opt, i) => ({
                        id: `${payload.id}-${i}`,
                        label: opt.answer,
                    }))
                )
            }
        }, [])
    )

    const sensors = useSensors(
        useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } }),
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const orderItemIds = useMemo(() => orderItems.map((item) => item.id), [orderItems])

    const handleOrderDragEnd = useCallback((event: DragEndEvent): void => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        setOrderItems((current) => {
            const oldIndex = current.findIndex((item) => item.id === active.id)
            const newIndex = current.findIndex((item) => item.id === over.id)
            return arrayMove(current, oldIndex, newIndex)
        })
    }, [])

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

    const onSubmitAnswer = useCallback((): void => {
        if (answered) return
        const answers =
            question?.type === "ORDER" ? orderItems.map((item) => item.label) : selectedAnswers
        if (answers.length === 0) return
        websocket.send({ command: "answerQuestion", payload: { answers } })
        setAnswered(true)
    }, [answered, question?.type, orderItems, selectedAnswers, websocket])

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
                    <CountdownDisplay timeLeft={timeLeft} variant="player" />
                </div>

                <QuestionContainer question={question.question} />

                {question.type === "ORDER" ? (
                    <>
                        <DndContext
                            collisionDetection={closestCorners}
                            onDragEnd={handleOrderDragEnd}
                            sensors={sensors}
                        >
                            <SortableContext
                                items={orderItemIds}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-4">
                                    {orderItems.map((item, index) => (
                                        <SortableOrderOption
                                            key={item.id}
                                            error={false}
                                            id={item.id}
                                            index={index}
                                            value={item.label}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {answered ? (
                            <p className="text-muted-foreground text-center text-sm font-medium">
                                Answer submitted — waiting for results…
                            </p>
                        ) : (
                            <Button
                                className="w-full rounded-xl"
                                onClick={onSubmitAnswer}
                                type="button"
                            >
                                Submit Order
                            </Button>
                        )}
                    </>
                ) : null}

                {question.type !== "SLIDE" && question.type !== "ORDER" && options.length > 0 ? (
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
                                onClick={onSubmitAnswer}
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
