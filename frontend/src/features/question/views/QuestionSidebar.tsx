// frontend/src/components/QuestionSidebar.tsx

import { ChevronDown, Plus } from "lucide-react"
import type { JSX } from "react"
import { useState } from "react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { useTranslation } from "react-i18next"
import { Button } from "@/shadcn/components/ui/button"
import QuestionItem from "@/features/question/views/QuestionItem.tsx"
import { ScrollArea } from "@/shadcn/components/ui/scroll-area"
import type { Question } from "@/features/question/types/questions.ts"

interface QuestionSidebarProps {
    activeIndex: number
    onAdd: () => void
    onDelete: (index: number) => void
    onSelect: (index: number) => void
    questionIds: string[]
    questions: Question[]
}

export default function QuestionSidebar({
    activeIndex,
    onAdd,
    onDelete,
    onSelect,
    questionIds,
    questions,
}: QuestionSidebarProps): JSX.Element {
    const { t } = useTranslation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <aside className="flex h-full max-h-[calc(100vh-180px)] min-h-0 flex-col overflow-hidden">
            <div className="lg:hidden">
                <Button
                    aria-expanded={isMobileOpen}
                    className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-4 font-bold text-[#FF8A00] shadow-none hover:bg-[#FF8A00]/15"
                    onClick={() => setIsMobileOpen((open) => !open)}
                    type="button"
                    variant="ghost"
                >
                    <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                        {t("quizEditor.sidebar.questions")} ({questions.length})
                    </span>

                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${isMobileOpen ? "rotate-180" : ""}`}
                    />
                </Button>

                {isMobileOpen ? (
                    <div className="mt-4 flex h-[45vh] flex-col overflow-hidden rounded-3xl border border-white/5 bg-black/10 p-4 shadow-inner">
                        <div
                            className="min-h-0 flex-1 overflow-y-auto pr-2"
                            style={{ touchAction: "pan-y" }}
                        >
                            <SortableContext
                                items={questionIds}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3 pb-2">
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
                            </SortableContext>
                        </div>

                        <Button
                            className="mt-3 h-12 w-full shrink-0 gap-2 rounded-2xl bg-[#00F2FF] font-bold text-black shadow-lg transition-all hover:bg-[#00d8e4]"
                            onClick={onAdd}
                            type="button"
                        >
                            <Plus className="h-4 w-4" />
                            {t("quizEditor.sidebar.addQuestion")}
                        </Button>
                    </div>
                ) : null}
            </div>

            <div className="hidden h-full min-h-0 flex-col lg:flex">
                <div className="mb-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#FF8A00] uppercase">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                        {t("quizEditor.sidebar.questions")}
                    </div>
                </div>

                <ScrollArea className="min-h-0 flex-1 pr-2">
                    <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 pb-4">
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
                    </SortableContext>
                </ScrollArea>

                <Button
                    className="mt-5 h-12 shrink-0 gap-2 rounded-2xl bg-[#00F2FF] font-bold text-black shadow-lg transition-all hover:scale-[1.01] hover:bg-[#00d8e4]"
                    onClick={onAdd}
                    type="button"
                >
                    <Plus className="h-4 w-4" />
                    {t("quizEditor.sidebar.addQuestion")}
                </Button>
            </div>
        </aside>
    )
}
