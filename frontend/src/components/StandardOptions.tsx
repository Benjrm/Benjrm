// frontend/src/components/StandardOptions.tsx

import type { JSX } from "react"
import { Plus } from "lucide-react"
import AnswerCard from "@/components/AnswerCard"
import { Button } from "@/shadcn/components/ui/button"
import type { QuestionOption } from "@/api/questions/questions.types.ts"

interface StandardOptionsProps {
    options: QuestionOption[]
    errorMissingAnswers: number[]
    onChange: (index: number, value: string) => void
    onDeleteOption: (index: number) => void
    onToggleCorrect: (index: number) => void
    onAddOption: () => void
}

export default function StandardOptions({
    options,
    errorMissingAnswers,
    onChange,
    onDeleteOption,
    onToggleCorrect,
    onAddOption,
}: StandardOptionsProps): JSX.Element {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {options.map((option, index) => (
                    <AnswerCard
                        key={option.id}
                        canDelete={options.length > 2}
                        correct={(option as { correct?: boolean }).correct ?? false}
                        error={errorMissingAnswers.includes(index)}
                        index={index}
                        onChange={(value) => onChange(index, value)}
                        onDelete={options.length > 2 ? () => onDeleteOption(index) : undefined}
                        onToggleCorrect={() => onToggleCorrect(index)}
                        placeholder={`Option ${index + 1}`}
                        value={(option as { answer?: string }).answer ?? ""}
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
