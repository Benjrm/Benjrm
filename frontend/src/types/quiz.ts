import type { QuestionApiResponse } from "@/api/questions/types/question.api.ts"

type QuestionChoiceOption = Extract<
    Extract<QuestionApiResponse["options"], unknown[]> extends (infer Option)[] ? Option : never,
    { correct: boolean }
>

export type QuestionOption = QuestionChoiceOption

export type Question = Omit<QuestionApiResponse, "options" | "created" | "modified"> & {
    options: QuestionChoiceOption[]
}
