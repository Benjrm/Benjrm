import type { Quiz, QuizDto } from "@/api/quizzes/quizzes.types.ts"

export default function toQuiz(dto: QuizDto): Quiz {
    return {
        ...dto,
        created: new Date(dto.created),
        modified: new Date(dto.modified),
    }
}
