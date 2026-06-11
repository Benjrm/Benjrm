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

interface SlideQuestionResponse
    extends BaseQuestionResponse, Omit<SlideQuestionRequest, "prev" | "next"> {}

interface OrderQuestionOptionResponse extends Identifier, OrderQuestionOptionRequest {}
interface OrderQuestionResponse
    extends BaseQuestionResponse, Omit<OrderQuestionRequest, "options" | "next" | "prev"> {
    options: OrderQuestionOptionResponse[]
}

interface SingleChoiceQuestionOptionResponse
    extends Identifier, SingleChoiceQuestionOptionRequest {}
interface SingleChoiceQuestionResponse
    extends BaseQuestionResponse, Omit<SingleChoiceQuestionRequest, "options" | "next" | "prev"> {
    options: SingleChoiceQuestionOptionResponse[]
}

interface MultipleChoiceQuestionOptionResponse
    extends Identifier, MultipleChoiceQuestionOptionRequest {}
interface MultipleChoiceQuestionResponse
    extends BaseQuestionResponse, Omit<MultipleChoiceQuestionRequest, "options" | "prev" | "next"> {
    options: MultipleChoiceQuestionOptionResponse[]
}

export type QuestionResponse =
    | SlideQuestionResponse
    | OrderQuestionResponse
    | SingleChoiceQuestionResponse
    | MultipleChoiceQuestionResponse
