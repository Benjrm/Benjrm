// frontend/src/components/QuestionAnswerOptions.tsx

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

import AnswerCard from "@/components/AnswerCard"
import SortableOrderOption from "@/components/SortableOrderOption"
import { Button } from "@/shadcn/components/ui/button"
import type { QuestionOption, Question } from "@/types/quiz"

interface QuestionAnswerOptionsProps {
    onAddOption: () => void
    onDeleteOption: (index: number) => void
    onChange: (index: number, value: string) => void
    onToggleCorrect: (index: number) => void
    onReorderOptions: (activeId: string, overId: string) => void
    options: QuestionOption[]
    type?: Question["type"]
}

export default function QuestionAnswerOptions({
    onAddOption,
    onDeleteOption,
    onChange,
    onToggleCorrect,
    onReorderOptions,
    options,
    type,
}: QuestionAnswerOptionsProps): JSX.Element {
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

    if (type === "ORDER") {
        return (
            <div className="space-y-4">
                <DndContext
                    collisionDetection={closestCorners}
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
                                    id={option.id}
                                    index={index}
                                    onChange={(value) => onChange(index, value)}
                                    placeholder={`Item ${index + 1}`}
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
                    Add Item
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {options.map((option, index) => (
                    <AnswerCard
                        key={option.id}
                        canDelete={options.length > 2}
                        correct={(option as { correct?: boolean }).correct ?? false}
                        index={index}
                        onChange={(value) => onChange(index, value)}
                        onDelete={options.length > 2 ? () => onDeleteOption(index) : undefined}
                        onToggleCorrect={() => onToggleCorrect(index)}
                        placeholder={`Option ${index + 1}`}
                        value={(option as { answer?: string }).answer ?? ""}
                    />
                ))}
            </div>

            <Button
                className="border-border bg-background/95 hover:bg-background/90 dark:bg-muted/40 dark:hover:bg-muted/70 w-full gap-2 rounded-2xl border backdrop-blur-sm"
                onClick={onAddOption}
                type="button"
                variant="ghost"
            >
                <Plus className="h-4 w-4" />
                Add Option
            </Button>
        </div>
    )
}
