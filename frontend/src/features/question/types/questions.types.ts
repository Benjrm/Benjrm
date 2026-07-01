import type { Identifier, ReadonlyMetadata } from "@/shared/utils/apiUtils.ts"

/**
 * Common properties shared by all question types.
 */
interface BaseQuestionRequest {
    question: string
    hidden: boolean
    prev?: string
    next?: string
}

/**
 * Informational slide without answer options.
 */
interface SlideQuestionRequest extends BaseQuestionRequest {
    type: "SLIDE"
}

interface OrderQuestionOptionRequest {
    answer: string
}

/**
 * Question where answers must be arranged in a specific order.
 * The "correct" property is not needed here since the order of options implies correctness.
 */
interface OrderQuestionRequest extends BaseQuestionRequest {
    type: "ORDER"
    options: OrderQuestionOptionRequest[]
}

interface SingleChoiceQuestionOptionRequest {
    correct: boolean
    answer: string
}

/**
 * Question where players can select only one correct answer from multiple options (2...n)
 * This type of question requires at least one correct answer.
 */
interface SingleChoiceQuestionRequest extends BaseQuestionRequest {
    type: "SINGLE_CHOICE"
    options: SingleChoiceQuestionOptionRequest[]
}

interface MultipleChoiceQuestionOptionRequest {
    correct: boolean
    answer: string
}

/**
 * Question where player can select multiple correct answers (1...n) from multiple options (2...n).
 * This type of question requires at least one correct answer.
 */
interface MultipleChoiceQuestionRequest extends BaseQuestionRequest {
    type: "MULTIPLE_CHOICE"
    options: MultipleChoiceQuestionOptionRequest[]
}

/**
 * Discriminated union type for all question requests, allowing type-safe handling of different question types based on the "type" property.
 */
export type QuestionRequest =
    | SlideQuestionRequest
    | OrderQuestionRequest
    | SingleChoiceQuestionRequest
    | MultipleChoiceQuestionRequest

/**
 * Adds an optional "id" property to the given type T, which is useful for updating existing options where the option's identifier is needed, but can be omitted when creating new options.
 */
type OptionUpdate<T> = T & { id?: string }

/**
 * Discriminated union type for update question requests.
 * Adds the "id" property to each option for questions containing options.
 * This updates the option on the backend instead of deleting the old one and creating a new one.
 * As a result performance increases.
 */
export type UpdateQuestionRequest =
    | SlideQuestionRequest
    | (OrderQuestionRequest & {
          options: OptionUpdate<OrderQuestionOptionRequest>[]
      })
    | (SingleChoiceQuestionRequest & {
          options: OptionUpdate<SingleChoiceQuestionOptionRequest>[]
      })
    | (MultipleChoiceQuestionRequest & {
          options: OptionUpdate<MultipleChoiceQuestionOptionRequest>[]
      })

/**
 * Common properties shared by all question responses,
 * including identifier and readonly metadata fields such as created and modified timestamps.
 * This serves as a base interface for all question response types, ensuring consistency across different question formats.
 */
interface BaseQuestionResponse extends Identifier, ReadonlyMetadata {}

/**
 * Removes "next" and "prev" property from the given type T.
 */
type RemoveNextAndPrev<T> = Omit<T, "next" | "prev">

/**
 * Removes "options" property from the given type T.
 */
type RemoveOptions<T> = Omit<T, "options">

/**
 * API response for a informational slide without answer options.
 */
export interface SlideQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<SlideQuestionRequest> {}

interface OrderQuestionOptionResponse extends Identifier, OrderQuestionOptionRequest {}

/**
 * API response for a question where answers must be arranged in a specific order.
 */
interface OrderQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<RemoveOptions<OrderQuestionRequest>> {
    options: OrderQuestionOptionResponse[]
}

interface SingleChoiceQuestionOptionResponse
    extends Identifier, SingleChoiceQuestionOptionRequest {}

/**
 * API response for a question where players can select only one correct answer from multiple options (2...n)
 */
interface SingleChoiceQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<RemoveOptions<SingleChoiceQuestionRequest>> {
    options: SingleChoiceQuestionOptionResponse[]
}

interface MultipleChoiceQuestionOptionResponse
    extends Identifier, MultipleChoiceQuestionOptionRequest {}

/**
 * API response for a question where player can select multiple correct answers (1...n) from multiple options (2...n).
 */
interface MultipleChoiceQuestionResponse
    extends BaseQuestionResponse, RemoveNextAndPrev<RemoveOptions<MultipleChoiceQuestionRequest>> {
    options: MultipleChoiceQuestionOptionResponse[]
}

/**
 * Discriminated union type for all question responses, allowing type-safe handling of different question types based on the "type" property.
 */
export type QuestionResponse =
    | SlideQuestionResponse
    | OrderQuestionResponse
    | SingleChoiceQuestionResponse
    | MultipleChoiceQuestionResponse

/**
 * Replaces metadata date strings with Date objects in the given type T, while keeping all other properties intact.
 */
type WithDates<T> = T extends unknown
    ? Omit<T, keyof ReadonlyMetadata> & {
          created: Date
          modified: Date
      }
    : never

/**
 * Question domain model used within the frontend application.
 */
export type Question = WithDates<QuestionResponse>

/**
 * Discriminated union type for all question option responses.
 */
export type QuestionOption =
    | OrderQuestionOptionResponse
    | SingleChoiceQuestionOptionResponse
    | MultipleChoiceQuestionOptionResponse

/**
 * All available question type identifiers
 */
export type QuestionType = QuestionRequest["type"]
