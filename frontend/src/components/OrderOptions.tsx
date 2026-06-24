// frontend/src/components/OrderOptions.tsx

import type { JSX } from "react"
import { Plus } from "lucide-react"
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    closestCorners,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { useTranslation } from "react-i18next"
import SortableOrderOption from "@/components/SortableOrderOption"
import { Button } from "@/shadcn/components/ui/button"
import { restrictToVerticalAxis, restrictToParentElement } from "@/pages/quiz/quizUtils"
import type { QuestionOption } from "@/api/questions/questions.types.ts"

interface OrderOptionsProps {
    options: QuestionOption[]
    errorMissingAnswers: number[]
    onChange: (index: number, value: string) => void
    onDeleteOption: (index: number) => void
    onReorderOptions: (activeId: string, overId: string) => void
    onAddOption: () => void
}

export default function OrderOptions({
    options,
    errorMissingAnswers,
    onChange,
    onDeleteOption,
    onReorderOptions,
    onAddOption,
}: OrderOptionsProps): JSX.Element {
    const { t } = useTranslation()
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

    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event

        if (!over || active.id === over.id) return

        onReorderOptions(String(active.id), String(over.id))
    }

    return (
        <div className="space-y-4">
            <DndContext
                collisionDetection={closestCorners}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
            >
                <SortableContext
                    items={options.map((option) => option.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-3">
                        {options.map((option, index) => (
                            <SortableOrderOption
                                key={option.id}
                                editable
                                showDelete
                                canDelete={options.length > 2}
                                error={errorMissingAnswers.includes(index)}
                                id={option.id}
                                index={index}
                                onChange={(value) => onChange(index, value)}
                                placeholder={`${t("quizEditor.options.item")} ${index + 1}`}
                                value={(option as { answer?: string }).answer ?? ""}
                                onDelete={
                                    options.length > 2 ? () => onDeleteOption(index) : undefined
                                }
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Button
                className="border-border bg-background/95 hover:bg-background/90 dark:bg-muted/40 dark:hover:bg-muted/70 w-full gap-2 rounded-2xl border backdrop-blur-sm"
                onClick={onAddOption}
                type="button"
                variant="ghost"
            >
                <Plus className="h-4 w-4" />
                {t("quizEditor.options.addItem")}
            </Button>
        </div>
    )
}
