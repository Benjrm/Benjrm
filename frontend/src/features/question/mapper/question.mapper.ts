import type {
    Question,
    QuestionRequest,
    QuestionResponse,
    UpdateQuestionRequest,
} from "@/features/question/types/questions.types.ts"
import assertNever from "@/shared/utils/assertNever"

/**
 * Converts a question's api response object to the question domain model used within the frontend application.
 * @param dto The question's api response object
 * @returns The question domain model used within the frontend application.
 */
export function toQuestion(dto: QuestionResponse): Question {
    return {
        ...dto,
        created: new Date(dto.created),
        modified: new Date(dto.modified),
    }
}

/**
 * Converts a question's domain model used within the frontend application to the question's api request object, which can be sent to the backend when creating (or updating) a question.
 * @param question The question domain model used within the frontend application.
 * @returns The question's api request object, which can be sent to the backend when creating (or updating) a question.
 */
export function questionToQuestionRequest(question: Question): QuestionRequest {
    switch (question.type) {
        case "SLIDE":
            return {
                type: question.type,
                question: question.question,
                hidden: question.hidden,
            }

        case "ORDER":
            return {
                type: question.type,
                question: question.question,
                hidden: question.hidden,
                options: question.options.map((option) => ({
                    answer: option.answer,
                })),
            }
        case "SINGLE_CHOICE":
        case "MULTIPLE_CHOICE":
            return {
                type: question.type,
                question: question.question,
                hidden: question.hidden,
                options: question.options.map((option) => ({
                    answer: option.answer,
                    correct: option.correct,
                })),
            }
        default:
            return assertNever(question)
    }
}

/**
 * Converts a question's domain model used within the frontend application to the question's api request object, which can be sent to the backend when updating a question.
 * @param question The question domain model used within the frontend application.
 * @returns The question's api request object, which can be sent to the backend when updating a question,
 */
export function questionToUpdateQuestionRequest(question: Question): UpdateQuestionRequest {
    switch (question.type) {
        case "SLIDE":
            return {
                type: question.type,
                question: question.question,
                hidden: question.hidden,
            }
        case "ORDER":
            return {
                type: question.type,
                question: question.question,
                hidden: question.hidden,
                options: question.options.map((option) => ({
                    id: option.id.startsWith("temp-") ? undefined : option.id,
                    answer: option.answer,
                })),
            }
        case "MULTIPLE_CHOICE":
        case "SINGLE_CHOICE":
            return {
                type: question.type,
                question: question.question,
                hidden: question.hidden,
                options: question.options.map((option) => ({
                    id: option.id.startsWith("temp-") ? undefined : option.id,
                    answer: option.answer,
                    correct: option.correct,
                })),
            }
        default:
            return assertNever(question)
    }
}
