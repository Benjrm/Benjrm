import type { Quiz, QuizDto } from "@/features/quiz/types/quizzes.ts"

/** Converts a quiz API response DTO into the frontend's {@link Quiz} domain model, parsing timestamp strings into `Date`s. */
export default function toQuiz(dto: QuizDto): Quiz {
    return {
        ...dto,
        created: new Date(dto.created),
        modified: new Date(dto.modified),
    }
}
