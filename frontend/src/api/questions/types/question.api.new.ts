import type { Identifier, ReadonlyMetadata } from "@/api/utils.ts"

interface BaseQuestionRequest {
    question: string
    hidden: boolean
    prev?: string
    next?: string
}

interface SlideQuestionRequest extends BaseQuestionRequest {
    type: "SLIDE"
}

interface OrderQuestionOptionRequest {
    answer: string
}
interface OrderQuestionRequest extends BaseQuestionRequest {
    type: "ORDER"
    options: OrderQuestionOptionRequest[]
}

interface SingleChoiceQuestionOptionRequest {
    correct: boolean
    answer: string
}
interface SingleChoiceQuestionRequest extends BaseQuestionRequest {
    type: "SINGLE_CHOICE"
    options: SingleChoiceQuestionOptionRequest[]
}

interface MultipleChoiceQuestionOptionRequest {
    correct: boolean
    answer: string
}
interface MultipleChoiceQuestionRequest extends BaseQuestionRequest {
    type: "MULTIPLE_CHOICE"
    options: MultipleChoiceQuestionOptionRequest[]
}

export type QuestionRequest =
    | SlideQuestionRequest
    | OrderQuestionRequest
    | SingleChoiceQuestionRequest
    | MultipleChoiceQuestionRequest

interface BaseQuestionResponse extends Identifier, ReadonlyMetadata {}

type RemoveReadonlyMetadata<T> = Omit<T, keyof ReadonlyMetadata>
type RemoveNextAndPrev<T> = Omit<T, "next" | "prev">
type RemoveOptions<T> = Omit<T, "options">

interface SlideQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<SlideQuestionRequest> {}

interface OrderQuestionOptionResponse extends Identifier, OrderQuestionOptionRequest {}
interface OrderQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<RemoveOptions<OrderQuestionRequest>> {
    options: OrderQuestionOptionResponse[]
}

interface SingleChoiceQuestionOptionResponse
    extends Identifier, SingleChoiceQuestionOptionRequest {}
interface SingleChoiceQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<RemoveOptions<SingleChoiceQuestionRequest>> {
    options: SingleChoiceQuestionOptionResponse[]
}

interface MultipleChoiceQuestionOptionResponse
    extends Identifier, MultipleChoiceQuestionOptionRequest {}
interface MultipleChoiceQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<RemoveOptions<MultipleChoiceQuestionRequest>> {
    options: MultipleChoiceQuestionOptionResponse[]
}

export type QuestionResponse =
    | SlideQuestionResponse
    | OrderQuestionResponse
    | SingleChoiceQuestionResponse
    | MultipleChoiceQuestionResponse

export interface Question extends RemoveReadonlyMetadata<QuestionResponse> {
    created: Date
    modified: Date
}

export type QuestionOption =
    | OrderQuestionOptionResponse
    | SingleChoiceQuestionOptionResponse
    | MultipleChoiceQuestionOptionResponse

export type QuestionType = QuestionRequest["type"]

export const questionTypes = [
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "SLIDE",
    "ORDER",
] as const satisfies readonly QuestionType[]
