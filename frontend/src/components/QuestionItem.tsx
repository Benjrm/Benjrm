import { Trash2 } from "lucide-react"
import type { MouseEvent, KeyboardEvent, ReactNode } from "react"
import type { Question } from "@/types/quiz.ts"
import { Button } from "@shadcn/components/ui/button.tsx"

interface QuestionProps {
    question: Question
    onSelect: (index: number) => void
    index: number
    onDelete: (index: number) => void
    activeIndex: number
}

export default function QuestionItem({
    question,
    onSelect,
    onDelete,
    index,
    activeIndex,
}: QuestionProps): ReactNode {
    const active = index === activeIndex

    const handleDeleteClick = (evt: MouseEvent<HTMLDivElement>) => {
        evt.stopPropagation()
        onDelete(index)
    }

    const handleDeleteKeyDown = (evt: KeyboardEvent<HTMLDivElement>) => {
        evt.stopPropagation()
        onDelete(index)
    }

    return (
        <Button
            key={question.id}
            onClick={() => onSelect(index)}
            variant="ghost"
            className={`group border-border bg-muted/30 relative h-auto w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl border p-4 text-left whitespace-normal shadow-lg backdrop-blur-sm transition-all duration-200 ${
                active
                    ? "border-[#00F2FF]/40 bg-[#00F2FF]/5 shadow-[0_0_30px_rgba(0,242,255,0.08)] hover:bg-[#00F2FF]/5"
                    : "hover:bg-muted/50 hover:border-[#00F2FF]/20"
            }`}
        >
            {/* Glow */}
            {active ? (
                <div className="absolute inset-0 bg-linear-to-br from-[#00F2FF]/10 to-transparent" />
            ) : null}

            <div className="relative">
                {/* Top */}
                <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-2.5 w-2.5 rounded-full ${
                                active ? "bg-[#00F2FF]" : "bg-muted-foreground/40"
                            }`}
                        />

                        <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                            Question {index + 1}
                        </span>
                    </div>

                    {/* Delete Button */}
                    <div
                        className="text-muted-foreground transition-colors hover:text-red-400"
                        onClick={handleDeleteClick}
                        onKeyDown={handleDeleteKeyDown}
                        role="button"
                        tabIndex={0}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </div>
                </div>

                {/* Title */}
                <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold">
                    {question.title || "Untitled question"}
                </p>

                {/* Preview */}
                <div className="grid grid-cols-2 gap-1.5 opacity-80">
                    <div className="h-2 rounded-full bg-[#2d4cc9]" />
                    <div className="h-2 rounded-full bg-[#ffa602]" />
                    <div className="h-2 rounded-full bg-[#11c8d4]" />
                    <div className="h-2 rounded-full bg-[#ff4949]" />
                </div>
            </div>
        </Button>
    )
}
