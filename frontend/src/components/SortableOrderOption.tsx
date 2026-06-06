import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import type { JSX } from "react"

import { Button } from "@/shadcn/components/ui/button"
import { Input } from "@/shadcn/components/ui/input"

interface SortableOrderOptionProps {
    id: string
    index: number
    value: string
    onChange?: (value: string) => void
    placeholder?: string
    onDelete?: () => void
    canDelete?: boolean
    showDelete?: boolean
    editable?: boolean
    error: boolean
}

export default function SortableOrderOption({
    id,
    index,
    value,
    onChange,
    placeholder,
    onDelete,
    canDelete = false,
    showDelete = false,
    editable = false,
    error,
}: SortableOrderOptionProps): JSX.Element {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    })

    return (
        <div
            ref={setNodeRef}
            className={`border-border/20 bg-muted/10 flex cursor-grab items-center gap-3 rounded-2xl border px-4 py-5 shadow-lg backdrop-blur-sm active:cursor-grabbing sm:py-4 ${
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
            <div
                {...attributes}
                {...listeners}
                className="text-muted-foreground/70 -mx-2 flex items-center self-stretch px-2 py-1 sm:-mx-1"
            >
                <GripVertical className="h-6 w-6 sm:h-5 sm:w-5" />
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10 text-sm font-black text-black/90 shadow-inner sm:h-8 sm:w-8 dark:bg-white/10 dark:text-white/90">
                {index + 1}
            </div>

            {editable ? (
                <div className="relative w-full">
                    <Input
                        onChange={(event) => onChange?.(event.target.value)}
                        placeholder={placeholder}
                        value={value}
                        className={`text-foreground h-12 rounded-xl text-base font-semibold shadow-none ${
                            error
                                ? "border-red-400! bg-red-50 dark:border-red-400/30! dark:bg-red-500/10"
                                : "border-border/40 bg-background/80"
                        }`}
                    />
                    {error ? (
                        <div className="absolute right-0 bottom-0 mx-2 mb-1 text-sm font-medium text-red-500">
                            This field is required
                        </div>
                    ) : null}
                </div>
            ) : (
                <p className="text-foreground text-lg font-bold tracking-tight select-none sm:text-lg">
                    {value}
                </p>
            )}

            {showDelete && canDelete && onDelete ? (
                <Button
                    className="ml-auto h-8 rounded-full border border-black/10 bg-black/5 px-3 text-[10px] font-bold tracking-widest text-black/70 shadow-none hover:bg-red-500/90 hover:text-white dark:border-white/10 dark:bg-black/20 dark:text-white"
                    onClick={onDelete}
                    type="button"
                    variant="ghost"
                >
                    Remove
                </Button>
            ) : null}
        </div>
    )
}
