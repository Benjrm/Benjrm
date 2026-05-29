import type { Identifier } from "@/api/utils.ts"

export interface MultipleChoiceAnswerRequest {
    text: string
    correct: boolean
}

export interface MultipleChoiceAnswerResponse extends MultipleChoiceAnswerRequest, Identifier {}
