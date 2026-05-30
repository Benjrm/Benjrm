import type { QuestionType } from "@/api/questions/types/questionType.ts"
import type {
    SingleChoiceAnswerRequest,
    SingleChoiceAnswerResponse,
} from "@/api/questions/types/singleChoiceAnswer.ts"
import type {
    MultipleChoiceAnswerRequest,
    MultipleChoiceAnswerResponse,
} from "@/api/questions/types/multipleChoiceAnswer.ts"
import type { Identifier, ReadonlyMetadata } from "@/api/utils.ts"

export interface QuestionApiRequest {
    question: string
    type: QuestionType
    hidden: boolean
    prev?: string
    next?: string
    options: (SingleChoiceAnswerRequest | MultipleChoiceAnswerRequest)[]
}

export interface QuestionApiResponse extends QuestionApiRequest, Identifier, ReadonlyMetadata {
    options: (SingleChoiceAnswerResponse | MultipleChoiceAnswerResponse)[]
}
