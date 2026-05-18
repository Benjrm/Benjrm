import { Plus, Trash2 } from "lucide-react"
import type { JSX } from "react"
import type { Question } from "../pages/QuizCreator"
import { Button } from "@/shadcn/components/ui/button"

interface QuestionSidebarProps {
    activeIndex: number
    onAdd: () => void
    onSelect: (index: number) => void
    questions: Question[]
}

export default function QuestionSidebar({
    activeIndex,
    onAdd,
    onSelect,
    questions,
}: QuestionSidebarProps): JSX.Element {
    return (
        <aside className="flex w-64 flex-col border-r border-white/10 bg-[#1a2234] p-4">
            <h2 className="text-muted-foreground mb-4 text-[10px] font-bold tracking-[0.2em] uppercase">
                Questions List
            </h2>
            <div className="flex-1 space-y-4 overflow-y-auto">
                {questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => onSelect(i)}
                        type="button"
                        className={`relative w-full cursor-pointer rounded-lg border-2 p-3 text-left transition-all ${
                            activeIndex === i
                                ? "border-[#00F2FF] bg-[#252f44]"
                                : "border-transparent bg-[#121926] hover:bg-[#252f44]"
                        }`}
                    >
                        <div className="mb-2 flex items-start justify-between">
                            <span className="text-[10px] font-bold text-gray-400">Q{i + 1}</span>
                            <div
                                className="text-gray-500 hover:text-red-400"
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Add delete logic here later
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation()
                                        // Add delete logic here later
                                    }
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </div>
                        </div>
                        <p className="mb-2 line-clamp-1 text-[10px] text-gray-400">
                            {q.title || "Untitled question"}
                        </p>
                        <div className="grid grid-cols-2 gap-1 opacity-60">
                            <div className="h-2 rounded-sm bg-[#2d4cc9]" />
                            <div className="h-2 rounded-sm bg-[#ffa602]" />
                            <div className="h-2 rounded-sm bg-[#11c8d4]" />
                            <div className="h-2 rounded-sm bg-[#ff4949]" />
                        </div>
                    </button>
                ))}
            </div>
            <Button
                className="mt-4 w-full gap-2 bg-[#00F2FF] font-bold text-black hover:bg-[#00d8e4]"
                onClick={onAdd}
            >
                <Plus className="h-4 w-4" /> Add New Question
            </Button>
        </aside>
    )
}
