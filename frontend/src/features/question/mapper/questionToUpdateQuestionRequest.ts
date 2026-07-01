import type { Question, UpdateQuestionRequest } from "@/features/question/types/questions.ts"
import assertNever from "@/shared/utils/assertNever.ts"

/**
 * Converts a question's domain model used within the frontend application to the question's api request object, which can be sent to the backend when updating a question.
 * @param question The question domain model used within the frontend application.
 * @returns The question's api request object, which can be sent to the backend when updating a question,
 */
export default function questionToUpdateQuestionRequest(question: Question): UpdateQuestionRequest {
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
