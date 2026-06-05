import type { QuestionApiResponse } from "@/api/questions/types/question.api.ts"

export type QuestionOption =
    Extract<QuestionApiResponse["options"], unknown[]> extends (infer Option)[] ? Option : never

export type Question = Omit<QuestionApiResponse, "options" | "created" | "modified"> & {
    options: QuestionOption[]
}
