import type { Question, QuestionResponse } from "@/features/question/types/questions.ts"

/**
 * Converts a question's api response object to the question domain model used within the frontend application.
 * @param dto The question's api response object
 * @returns The question domain model used within the frontend application.
 */
export default function toQuestion(dto: QuestionResponse): Question {
    return {
        ...dto,
        created: new Date(dto.created),
        modified: new Date(dto.modified),
    }
}
