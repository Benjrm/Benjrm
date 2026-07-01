import type { Question, QuestionRequest } from "@/features/question/types/questions.ts"
import assertNever from "@/shared/utils/assertNever.ts"

/**
 * Converts a question's domain model used within the frontend application to the question's api request object, which can be sent to the backend when creating (or updating) a question.
 * @param question The question domain model used within the frontend application.
 * @returns The question's api request object, which can be sent to the backend when creating (or updating) a question.
 */
export default function questionToQuestionRequest(question: Question): QuestionRequest {
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
