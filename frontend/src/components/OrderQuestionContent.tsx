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
import type { JSX } from "react"
import { useMemo, useState } from "react"

import SortableOrderOption from "@/components/SortableOrderOption"

interface OrderItem {
    id: string
    label: string
}

const MOCK_ITEMS: OrderItem[] = [
    { id: "item-1", label: "Irgendwas 1" },
    { id: "item-2", label: "Irgendwas 2" },
    { id: "item-3", label: "Irgendwas 3" },
    { id: "item-4", label: "Irgendwas 4" },
]

export default function OrderQuestionContent(): JSX.Element {
    const [items, setItems] = useState<OrderItem[]>(MOCK_ITEMS)

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
        const { active, over } = event

        if (!over || active.id === over.id) return

        setItems((currentItems) => {
            const oldIndex = currentItems.findIndex((item) => item.id === active.id)
            const newIndex = currentItems.findIndex((item) => item.id === over.id)

            return arrayMove(currentItems, oldIndex, newIndex)
        })
    }

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto flex max-w-xl flex-col gap-8">
                <div className="flex items-center justify-center">
                    <div className="bg-muted/30 border-border/40 rounded-full border px-8 py-3 shadow-sm backdrop-blur-sm">
                        <span className="text-base font-bold sm:text-lg">Funny Crocodile</span>
                    </div>
                </div>

                <div className="bg-muted/20 border-border/10 rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
                    <div className="mb-4 flex items-start justify-end">
                        <div className="text-foreground text-3xl font-black tracking-tight sm:text-4xl">
                            3 / 27
                        </div>
                    </div>

                    <h1 className="text-foreground max-w-md text-3xl leading-tight font-black tracking-tight sm:text-4xl">
                        Bring the elements in the correct order
                    </h1>

                    <div className="mt-5 h-3 w-[72%] rounded-full bg-white/5">
                        <div className="h-full w-[58%] rounded-full bg-[#00F2FF] shadow-[0_0_18px_rgba(0,242,255,0.65)]" />
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
