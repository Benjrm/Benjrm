/* eslint-disable react/jsx-no-bind */
import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { DragEndEvent } from "@dnd-kit/core"
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@/shadcn/components/ui/button"
import TimerBar from "@/features/question/views/TimerBar"
import QuestionHeader from "@/features/question/views/QuestionHeader"
import QuestionContainer from "@/features/question/views/QuestionContainer"
import useQuestionTimer from "@/features/question/hooks/useQuestionTimer"
import restrictToParentElement from "@/features/quiz/utils/restrictToParentElement.ts"
import restrictToVerticalAxis from "@/features/quiz/utils/restrictToVerticalAxis.ts"
import SortableItem from "@/features/question/views/SortableItem.tsx"

interface Option {
    id: string
    text: string
}

interface OrderQuestionContentProps {
    currentQuestionIndex?: number
    initialItemOrder?: string[]
    initialHasAnswered?: boolean
    isHost?: boolean
    onNextQuestion?: () => void
    onItemOrderChange?: (ids: string[]) => void
    options?: Option[]
    playerName?: string
    playerEmoji?: string
    questionText?: string
    secondsToAnswer?: number | null
    questionExpiresAt?: number | null
    totalQuestions?: number
    onSendAnswer?: (answerIds: string[]) => void
}

export default function OrderQuestionContent({
    currentQuestionIndex = 0,
    initialItemOrder,
    initialHasAnswered = false,
    isHost = false,
    onNextQuestion,
    onItemOrderChange,
    options = [],
    playerName,
    playerEmoji,
    questionText,
    secondsToAnswer = null,
    questionExpiresAt = null,
    totalQuestions = 0,
    onSendAnswer,
}: Readonly<OrderQuestionContentProps>): JSX.Element {
    const { t } = useTranslation()
    const [items, setItems] = useState<Option[]>(() => {
        if (initialItemOrder && initialItemOrder.length > 0) {
            const ordered = initialItemOrder
                .map((id) => options.find((o) => o.id === id))
                .filter((o): o is Option => o !== undefined)
            return ordered.length === options.length ? ordered : options
        }
        return options
    })
    const [hasAnswered, setHasAnswered] = useState(initialHasAnswered)
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
                const next = arrayMove(prevItems, oldIndex, newIndex)
                onItemOrderChange?.(next.map((i) => i.id))
                return next
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
                    fastAnimation={false}
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
