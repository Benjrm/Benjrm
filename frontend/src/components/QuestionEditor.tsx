// frontend/src/components/QuestionEditor.tsx

import type { JSX } from "react"
import QuestionAnswerOptions from "./QuestionAnswerOptions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shadcn/components/ui/select"
import { Textarea } from "@/shadcn/components/ui/textarea"
import type { Question } from "@/types/quiz"

interface QuestionEditorProps {
    question: Question
    questionIndex: number
    totalQuestions: number
    updateQuestion: (data: Partial<Question>) => void
    onAddOption: () => void
    onChangeOption: (index: number, value: string) => void
    onDeleteOption: (index: number) => void
    onToggleCorrect: (index: number) => void
    onReorderOptions: (activeId: string, overId: string) => void
}

export default function QuestionEditor({
    question,
    questionIndex,
    totalQuestions,
    updateQuestion,
    onAddOption,
    onChangeOption,
    onDeleteOption,
    onToggleCorrect,
    onReorderOptions,
}: QuestionEditorProps): JSX.Element {
    return (
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            {/* Question Card */}
            <div className="bg-background/90 dark:bg-muted/30 border-border relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-sm md:p-8">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />

                <div className="relative">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-muted-foreground text-sm font-medium tracking-wide">
                            Question {questionIndex + 1} of {totalQuestions}
                        </div>

                        <Select
                            value={question.type}
                            onValueChange={(v: string) =>
                                updateQuestion({ type: v as Question["type"] })
                            }
                        >
                            <SelectTrigger className="bg-background/70 border-border w-52 backdrop-blur-sm">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                                <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                                <SelectItem value="ORDER">Order</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Textarea
                        className="placeholder:text-muted-foreground/40 bg-muted/90 dark:bg-muted/25 min-h-40 resize-none border-none p-4 text-3xl leading-tight font-bold shadow-none focus-visible:ring-0 md:text-4xl"
                        placeholder="Type your question here..."
                        value={question.question}
                        onChange={(e) =>
                            updateQuestion({
                                question: e.target.value,
                            })
                        }
                    />
                </div>
            </div>

            {/* Answers / Editor for choice-based questions */}
            <QuestionAnswerOptions
                onAddOption={onAddOption}
                onChange={onChangeOption}
                onDeleteOption={onDeleteOption}
                onReorderOptions={onReorderOptions}
                onToggleCorrect={onToggleCorrect}
                options={question.options}
                type={question.type}
            />
        </main>
    )
}
