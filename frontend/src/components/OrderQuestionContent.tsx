// frontend/src/components/OrderQuestionContent.tsx
/* eslint-disable react/jsx-no-bind */

import type { JSX } from "react"
import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/shadcn/components/ui/button"
import TimerBar from "@/components/TimerBar"
import QuestionHeader from "@/components/QuestionHeader"
import QuestionContainer from "@/components/QuestionContainer"
import useQuestionTimer from "@/hooks/useQuestionTimer"
import { restrictToVerticalAxis, restrictToParentElement } from "@/pages/quiz/quizUtils"

interface Option {
    id: string
    text: string
}

export interface OrderQuestionContentProps {
    currentQuestionIndex?: number
    isHost?: boolean
    onNextQuestion?: () => void
    options?: Option[]
    playerName?: string
    playerEmoji?: string
    questionText?: string
    secondsToAnswer?: number | null
    questionExpiresAt?: number | null
    totalQuestions?: number
    onSendAnswer?: (answerIds: string[]) => void
}

function SortableItem({ id, text }: { id: string; text: string }): JSX.Element {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`text-foreground flex touch-none items-center justify-between rounded-xl border p-4 font-semibold shadow-sm transition-colors ${
                isDragging
                    ? "border-[#00D4E8] bg-[#00D4E8]/20"
                    : "border-border bg-muted/30 hover:bg-muted/60"
            }`}
        >
            <div className="[&_p]:m-0">
                <ReactMarkdown
                    unwrapDisallowed
                    allowedElements={["p", "strong", "em", "code", "del", "s"]}
                    remarkPlugins={[remarkGfm]}
                >
                    {text}
                </ReactMarkdown>
            </div>
            <span className="text-muted-foreground text-xl">≡</span>
        </div>
    )
}

export default function OrderQuestionContent({
    currentQuestionIndex = 0,
    isHost = false,
    onNextQuestion,
    options = [],
    playerName,
    playerEmoji,
    questionText,
    secondsToAnswer = null,
    questionExpiresAt = null,
    totalQuestions = 0,
    onSendAnswer,
}: OrderQuestionContentProps): JSX.Element {
    const { t } = useTranslation()
    const [items, setItems] = useState<Option[]>(options)
    const [hasAnswered, setHasAnswered] = useState(false)
    const timeLeft = useQuestionTimer(questionExpiresAt ?? null, secondsToAnswer ?? null)

    // Automatisches Senden, wenn die Zeit abläuft
    useEffect(() => {
        if (timeLeft === 0 && !hasAnswered && !isHost) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasAnswered(true)
            if (onSendAnswer) {
                onSendAnswer(items.map((item) => item.id))
            }
        }
    }, [timeLeft, hasAnswered, isHost, items, onSendAnswer])

    // Drag-and-Drop Sensoren
    const sensors = useSensors(
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const itemIds = useMemo(() => items.map((i) => i.id), [items])

    // Wird aufgerufen, wenn ein Element nach dem Ziehen losgelassen wird
    function handleDragEnd(event: DragEndEvent): void {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setItems((prevItems) => {
                const oldIndex = prevItems.findIndex((item) => item.id === active.id)
                const newIndex = prevItems.findIndex((item) => item.id === over.id)
                return arrayMove(prevItems, oldIndex, newIndex)
            })
        }
    }

    // Antwort senden
    function handleSend(): void {
        if (hasAnswered) return
        setHasAnswered(true)
        if (onSendAnswer) {
            // Mappe das Array so, dass nur die IDs der aktuellen Reihenfolge gesendet werden
            onSendAnswer(items.map((item) => item.id))
        }
    }

    return (
        <div className="flex w-full flex-col items-center p-4">
            <div className="bg-card text-card-foreground w-full max-w-2xl rounded-2xl border p-6 shadow-xl">
                <QuestionHeader
                    currentQuestion={currentQuestionIndex + 1}
                    playerEmoji={playerEmoji}
                    remainingTime={timeLeft}
                    totalQuestions={totalQuestions}
                    playerName={
                        playerName ?? (isHost ? t("game.player.host") : t("game.player.player"))
                    }
                />

                <TimerBar
                    className="mb-6"
                    timeLeft={timeLeft}
                    totalSeconds={secondsToAnswer ?? null}
                />

                <QuestionContainer question={questionText} />

                {/* Ansicht für den Host */}
                {isHost ? (
                    <div className="flex flex-col items-center gap-6 py-12">
                        <p className="text-muted-foreground text-center text-lg">
                            {t("game.question.playersReading")}
                        </p>
                        <Button
                            className="bg-[#00D4E8] px-8 py-6 text-lg font-bold text-black hover:bg-[#00BDD0]"
                            onClick={onNextQuestion}
                        >
                            {t("game.question.skipNext")}
                        </Button>
                    </div>
                ) : (
                    /* Ansicht für die Spieler (Drag & Drop) */
                    <div className="flex flex-col gap-6">
                        <DndContext
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            onDragEnd={handleDragEnd}
                            sensors={sensors}
                        >
                            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                                <div
                                    className={`flex flex-col gap-3 ${
                                        hasAnswered
                                            ? "pointer-events-none opacity-50 grayscale"
                                            : ""
                                    }`}
                                >
                                    {items.map((item) => (
                                        <SortableItem key={item.id} id={item.id} text={item.text} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <Button
                            className="disabled:bg-muted disabled:text-muted-foreground mt-4 bg-[#00D4E8] py-6 text-lg font-bold text-black hover:bg-[#00BDD0]"
                            disabled={hasAnswered}
                            onClick={handleSend}
                        >
                            {hasAnswered ? t("game.answer.sent") : t("game.answer.submitOrder")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
