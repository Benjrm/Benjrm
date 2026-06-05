import type { Identifier } from "@/api/utils.ts"

export interface MultipleChoiceAnswerRequest {
    id?: string | null
    answer: string
    correct: boolean
}

export interface MultipleChoiceAnswerResponse
    extends Omit<MultipleChoiceAnswerRequest, "id">, Identifier {}
