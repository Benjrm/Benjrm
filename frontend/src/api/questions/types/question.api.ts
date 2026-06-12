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
import type {
    SlideAnswerRequest,
    SlideAnswerResponse,
} from "@/api/questions/types/slideAnswerRequest.ts"
import type {
    OrderAnswerRequest,
    OrderAnswerResponse,
} from "@/api/questions/types/orderAnswerRequest.ts"

/**
 * @deprecated
 */
export interface QuestionApiRequest {
    question: string
    type: QuestionType
    hidden: boolean
    prev?: string
    next?: string
    options:
        | SlideAnswerRequest
        | (SingleChoiceAnswerRequest | MultipleChoiceAnswerRequest | OrderAnswerRequest)[]
}

/**
 * @deprecated
 */
export interface QuestionApiResponse
    extends Omit<QuestionApiRequest, "prev" | "next" | "options">, Identifier, ReadonlyMetadata {
    options:
        | SlideAnswerResponse
        | (SingleChoiceAnswerResponse | MultipleChoiceAnswerResponse | OrderAnswerResponse)[]
}
