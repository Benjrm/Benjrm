import type { JSX } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface SortableItemProps {
    id: string
    text: string
}

export default function SortableItem({ id, text }: Readonly<SortableItemProps>): JSX.Element {
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
