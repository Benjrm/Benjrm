// frontend/src/components/QuestionAnswerOptions.tsx

import type { JSX } from "react"
import { Plus } from "lucide-react"

import getAnswerVisuals from "./answerVisuals"
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
                {options.map((option, index) => {
                    const definition = getAnswerVisuals(index)

                    return (
                        <AnswerCard
                            key={option.id}
                            accent={definition.accent}
                            canDelete={options.length > 2}
                            correct={option.correct}
                            glow={definition.glow}
                            icon={definition.icon}
                            onChange={(value) => onChange(index, value)}
                            onDelete={options.length > 2 ? () => onDeleteOption(index) : undefined}
                            onToggleCorrect={() => onToggleCorrect(index)}
                            placeholder={`Option ${index + 1}`}
                            value={option.text}
                        />
                    )
                })}
            </div>

            <Button
                className="border-border bg-muted/40 hover:bg-muted/70 w-full gap-2 rounded-2xl border backdrop-blur-sm"
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
