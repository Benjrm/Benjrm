// frontend/src/components/QuestionSidebar.tsx

import { Plus, Trash2 } from "lucide-react"
import type { JSX } from "react"

import type { Question } from "../types/quiz"

import { Button } from "@/shadcn/components/ui/button"

interface QuestionSidebarProps {
    activeIndex: number
    onAdd: () => void
    onDelete: (index: number) => void
    onSelect: (index: number) => void
    questions: Question[]
}

export default function QuestionSidebar({
    activeIndex,
    onAdd,
    onDelete,
    onSelect,
    questions,
}: QuestionSidebarProps): JSX.Element {
    return (
        <aside className="flex h-full max-h-[calc(100vh-180px)] flex-col">
            {/* Header */}
            <div className="mb-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    Questions
                </div>
            </div>

            {/* Question List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {questions.map((q, i) => {
                    const active = activeIndex === i

                    return (
                        <Button
                            key={q.id}
                            onClick={() => onSelect(i)}
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
                                            Question {i + 1}
                                        </span>
                                    </div>

                                    {/* Delete Button */}
                                    <div
                                        className="text-muted-foreground transition-colors hover:text-red-400"
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(i)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.stopPropagation()
                                                onDelete(i)
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </div>
                                </div>

                                {/* Title */}
                                <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold">
                                    {q.title || "Untitled question"}
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
                })}
            </div>

            {/* Add Button */}
            <Button
                className="mt-5 h-12 shrink-0 gap-2 rounded-2xl bg-[#00F2FF] font-bold text-black shadow-lg transition-all hover:scale-[1.01] hover:bg-[#00d8e4]"
                onClick={onAdd}
            >
                <Plus className="h-4 w-4" />
                Add Question
            </Button>
        </aside>
    )
}
