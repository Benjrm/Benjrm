// frontend/src/components/QuestionSidebar.tsx

import { Plus } from "lucide-react"
import type { JSX } from "react"

import type { Question } from "../types/quiz"

import { Button } from "@/shadcn/components/ui/button"
import QuestionItem from "@/components/QuestionItem.tsx"

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
                {questions.map((question, index) => (
                    <QuestionItem
                        key={question.id}
                        activeIndex={activeIndex}
                        index={index}
                        onDelete={onDelete}
                        onSelect={onSelect}
                        question={question}
                    />
                ))}
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
