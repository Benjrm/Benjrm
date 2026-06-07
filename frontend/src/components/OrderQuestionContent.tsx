// frontend/src/components/OrderQuestionContent.tsx

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
import { useCallback, useMemo, useState } from "react"
import type { JSX } from "react"

import ActiveQuestionHeader from "@/components/ActiveQuestionHeader"
import SortableOrderOption from "@/components/SortableOrderOption"
import { useWebSocket, useSocketEvent, useWebSocketContext } from "@/api/websocket"
import useMockOrderEvents from "@/api/websocket/hooks/useMockOrderEvents"

const QUESTION_DURATION = 30 // seconds — update when backend provides this per-question

interface OrderItem {
    id: string
    label: string
}

interface Props {
    code: string | undefined
    isMock?: boolean
    questionNumber: number
    onNextQuestion: () => void
}

export default function OrderQuestionContent({
    code,
    isMock = false,
    questionNumber,
    onNextQuestion,
}: Props): JSX.Element {
    const [questionText, setQuestionText] = useState<string | null>(null)
    const [initialTimeLeft, setInitialTimeLeft] = useState(QUESTION_DURATION)
    const [items, setItems] = useState<OrderItem[]>([])
    const [submitted, setSubmitted] = useState(false)

    useWebSocket(code)
    const ws = useWebSocketContext()

    useSocketEvent("displayQuestion", (payload, timing) => {
        if (payload.type !== "ORDER") return
        const options = payload.options as Record<string, string>
        setQuestionText(payload.question)
        setItems(Object.entries(options).map(([id, label]) => ({ id, label })))
        setSubmitted(false)
        onNextQuestion()
        const elapsedSeconds = Math.floor((Date.now() - new Date(timing).getTime()) / 1000)
        setInitialTimeLeft(Math.max(0, QUESTION_DURATION - elapsedSeconds))
    })

    // Must be called after all useSocketEvent hooks so subscriptions are registered first
    useMockOrderEvents(isMock)

    const handleTimeUp = useCallback(() => {
        if (submitted || items.length === 0) return
        ws.send({ command: "answerQuestion", payload: { answers: items.map((item) => item.id) } })
        setSubmitted(true)
    }, [submitted, items, ws])

    const sensors = useSensors(
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 0,
                tolerance: 5,
            },
        }),
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const itemIds = useMemo(() => items.map((item) => item.id), [items])

    const handleDragEnd = (event: DragEndEvent): void => {
        if (submitted) return
        const { active, over } = event

        if (!over || active.id === over.id) return

        setItems((currentItems) => {
            const oldIndex = currentItems.findIndex((item) => item.id === active.id)
            const newIndex = currentItems.findIndex((item) => item.id === over.id)

            return arrayMove(currentItems, oldIndex, newIndex)
        })
    }

    if (!questionText) {
        return (
            <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
                <div className="bg-muted/20 border-border/10 rounded-[2rem] border p-10 text-center shadow-2xl backdrop-blur-sm">
                    <p className="text-muted-foreground text-lg font-medium">
                        Waiting for the host…
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto flex max-w-xl flex-col gap-8">
                <ActiveQuestionHeader
                    key={questionNumber}
                    initialTimeLeft={initialTimeLeft}
                    onTimeUp={handleTimeUp}
                    questionDuration={QUESTION_DURATION}
                    questionNumber={questionNumber}
                    questionText={questionText}
                />

                <DndContext
                    collisionDetection={closestCorners}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-4 pb-6">
                            {items.map((item, index) => (
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
            </div>
        </div>
    )
}
