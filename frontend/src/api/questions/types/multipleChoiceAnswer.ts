import type { Identifier } from "@/api/utils.ts"

export interface MultipleChoiceAnswerRequest {
    answer: string
    correct: boolean
}

export interface MultipleChoiceAnswerResponse extends MultipleChoiceAnswerRequest, Identifier {}
