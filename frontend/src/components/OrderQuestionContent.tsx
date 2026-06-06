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
import { useRef, useCallback, useEffect, useMemo, useState } from "react"
import type { JSX } from "react"

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
}

export default function OrderQuestionContent({ code, isMock = false }: Props): JSX.Element {
    const [questionText, setQuestionText] = useState<string | null>(null)
    const [questionNumber, setQuestionNumber] = useState(0)
    const [items, setItems] = useState<OrderItem[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useWebSocket(code)
    const ws = useWebSocketContext()

    useSocketEvent(
        "displayQuestion",
        useCallback((payload, timing) => {
            if (payload.type !== "ORDER") return
            const options = payload.options as Record<string, string>
            setQuestionText(payload.question)
            setItems(Object.entries(options).map(([id, label]) => ({ id, label })))
            setSubmitted(false)
            setQuestionNumber((n) => n + 1)
            const elapsedSeconds = Math.floor((Date.now() - new Date(timing).getTime()) / 1000)
            setTimeLeft(Math.max(0, QUESTION_DURATION - elapsedSeconds))
        }, [])
    )

    // Must be called after all useSocketEvent hooks so subscriptions are registered first
    useMockOrderEvents(isMock)

    // Countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return undefined
        const id = setTimeout(() => setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft])

    // Auto-submit when timer reaches 0
    const autoSubmittedRef = useRef(false)

    useEffect(() => {
        if (timeLeft !== 0 || autoSubmittedRef.current || items.length === 0) return
        autoSubmittedRef.current = true
        ws.send({ command: "answerQuestion", payload: { answers: items.map((item) => item.id) } })
        setSubmitted(true)
    }, [timeLeft, items, ws])

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

    const timerPercent = timeLeft !== null ? Math.max(0, (timeLeft / QUESTION_DURATION) * 100) : 100

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
                <div className="bg-muted/20 border-border/10 rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
                    <div className="mb-4 flex items-start justify-between">
                        <span className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
                            Question {questionNumber}
                        </span>
                        <span className="text-foreground text-3xl font-black tracking-tight sm:text-4xl">
                            {timeLeft ?? QUESTION_DURATION}
                        </span>
                    </div>

                    <h1 className="text-foreground max-w-md text-3xl leading-tight font-black tracking-tight sm:text-4xl">
                        {questionText}
                    </h1>

                    <div className="mt-5 h-3 w-full rounded-full bg-white/5">
                        <div
                            className="h-full rounded-full bg-[#00F2FF] shadow-[0_0_18px_rgba(0,242,255,0.65)] transition-[width] duration-1000 ease-linear"
                            style={{ width: `${timerPercent}%` }}
                        />
                    </div>
                </div>

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
