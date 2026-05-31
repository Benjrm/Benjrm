import type { Identifier } from "@/api/utils.ts"

export interface SingleChoiceAnswerRequest {
    id?: string | null
    answer: string
    correct: boolean
}

export interface SingleChoiceAnswerResponse
    extends Omit<SingleChoiceAnswerRequest, "id">, Identifier {}
