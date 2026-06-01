import type { QuestionApiResponse } from "@/api/questions/types/question.api.ts"

type ArrayOption =
    Extract<QuestionApiResponse["options"], unknown[]> extends (infer Option)[] ? Option : never

export type QuestionOption = ArrayOption

export type Question = Omit<QuestionApiResponse, "options" | "created" | "modified"> & {
    options: QuestionOption[]
}
