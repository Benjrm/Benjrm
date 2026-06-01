// frontend/src/components/QuestionAnswerOptions.tsx

import type { JSX } from "react"
import { Plus } from "lucide-react"

import AnswerCard from "@/components/AnswerCard"
import { Button } from "@/shadcn/components/ui/button"
import type { QuestionOption } from "@/types/quiz"

interface QuestionAnswerOptionsProps {
    onAddOption: () => void
    onDeleteOption: (index: number) => void
    onChange: (index: number, value: string) => void
    onToggleCorrect: (index: number) => void
    options: QuestionOption[]
}

export default function QuestionAnswerOptions({
    onAddOption,
    onDeleteOption,
    onChange,
    onToggleCorrect,
    options,
}: QuestionAnswerOptionsProps): JSX.Element {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {options.map((option, index) => (
                    <AnswerCard
                        key={option.id}
                        canDelete={options.length > 2}
                        correct={option.correct}
                        index={index}
                        onChange={(value) => onChange(index, value)}
                        onDelete={options.length > 2 ? () => onDeleteOption(index) : undefined}
                        onToggleCorrect={() => onToggleCorrect(index)}
                        placeholder={`Option ${index + 1}`}
                        value={option.answer}
                    />
                ))}
            </div>

            <Button
                className="border-border bg-background/95 hover:bg-background/90 dark:bg-muted/40 dark:hover:bg-muted/70 w-full gap-2 rounded-2xl border backdrop-blur-sm"
                onClick={onAddOption}
                type="button"
                variant="ghost"
            >
                <Plus className="h-4 w-4" />
                Add Option
            </Button>
        </div>
    )
}
