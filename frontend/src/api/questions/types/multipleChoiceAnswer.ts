import type { Identifier } from "@/api/utils.ts"

/**
 * @deprecated
 */
export interface MultipleChoiceAnswerRequest {
    id?: string | null
    answer: string
    correct: boolean
}

/**
 * @deprecated
 */
export interface MultipleChoiceAnswerResponse
    extends Omit<MultipleChoiceAnswerRequest, "id">, Identifier {}
