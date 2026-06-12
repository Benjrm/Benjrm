import type { Identifier } from "@/api/utils.ts"

/**
 * @deprecated
 */
export interface SingleChoiceAnswerRequest {
    id?: string | null
    answer: string
    correct: boolean
}

/**
 * @deprecated
 */
export interface SingleChoiceAnswerResponse
    extends Omit<SingleChoiceAnswerRequest, "id">, Identifier {}
