import type { Question, QuestionResponse } from "@/api/questions/types/question.api.new.ts"

export default function toQuestion(dto: QuestionResponse): Question {
    return {
        ...dto,
        created: new Date(dto.created),
        modified: new Date(dto.modified),
    }
}
