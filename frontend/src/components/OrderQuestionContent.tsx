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
import { CSS } from "@dnd-kit/utilities"
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import type { JSX } from "react"
import { useMemo, useState } from "react"

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

function SortableOrderItem({ item, index }: { item: OrderItem; index: number }): JSX.Element {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    })

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`bg-muted/10 border-border/20 flex cursor-grab items-center gap-3 rounded-2xl border px-4 py-5 shadow-lg backdrop-blur-sm active:cursor-grabbing sm:px-4 sm:py-4 ${
                isDragging
                    ? "z-50 scale-[1.01] opacity-80 shadow-[0_0_40px_rgba(0,242,255,0.18)] ring-2 ring-[#FF8A00]/60"
                    : "transition-all duration-200"
            }`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition: isDragging ? "none" : transition,
                touchAction: "none",
            }}
        >
            <div className="text-muted-foreground/70 -mx-2 flex items-center self-stretch px-2 py-1 sm:-mx-1">
                <GripVertical className="h-6 w-6 sm:h-5 sm:w-5" />
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white/90 shadow-inner sm:h-8 sm:w-8">
                {index + 1}
            </div>

            <p className="text-foreground text-lg font-bold tracking-tight select-none sm:text-lg">
                {item.label}
            </p>
        </div>
    )
}

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
                                <SortableOrderItem key={item.id} index={index} item={item} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    )
}
