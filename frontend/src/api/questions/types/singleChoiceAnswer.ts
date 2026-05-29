import type { Identifier } from "@/api/utils.ts"

export interface SingleChoiceAnswerRequest {
    text: string
    correct: boolean
}

export interface SingleChoiceAnswerResponse extends SingleChoiceAnswerRequest, Identifier {}
