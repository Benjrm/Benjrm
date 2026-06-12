// frontend/src/components/QuestionAnswerOptions.tsx

import type { JSX } from "react"
import OrderOptions from "./OrderOptions"
import StandardOptions from "./StandardOptions"
import type {
    QuestionOption,
    QuestionType,
} from "@/api/questions/types/question.api.new.ts"

interface QuestionAnswerOptionsProps {
    onAddOption: () => void
    onDeleteOption: (index: number) => void
    onChange: (index: number, value: string) => void
    onToggleCorrect: (index: number) => void
    onReorderOptions: (activeId: string, overId: string) => void
    options: QuestionOption[]
    type?: QuestionType
    errorMissingAnswers: number[]
}

export default function QuestionAnswerOptions({
    onAddOption,
    onDeleteOption,
    onChange,
    onToggleCorrect,
    onReorderOptions,
    options,
    type,
    errorMissingAnswers,
}: QuestionAnswerOptionsProps): JSX.Element {
    if (type === "ORDER") {
        return (
            <OrderOptions
                errorMissingAnswers={errorMissingAnswers}
                onAddOption={onAddOption}
                onChange={onChange}
                onDeleteOption={onDeleteOption}
                onReorderOptions={onReorderOptions}
                options={options}
            />
        )
    }

    return (
        <StandardOptions
            errorMissingAnswers={errorMissingAnswers}
            onAddOption={onAddOption}
            onChange={onChange}
            onDeleteOption={onDeleteOption}
            onToggleCorrect={onToggleCorrect}
            options={options}
        />
    )
}
