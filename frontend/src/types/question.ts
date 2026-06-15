import type { QuestionApiResponse } from "@/api/questions/types/question.api.ts"

/**
 * @deprecated
 */
export type QuestionOption =
    Extract<QuestionApiResponse["options"], unknown[]> extends (infer Option)[] ? Option : never

/**
 * @deprecated
 */
export type Question = Omit<QuestionApiResponse, "options" | "created" | "modified"> & {
    options: QuestionOption[]
}
