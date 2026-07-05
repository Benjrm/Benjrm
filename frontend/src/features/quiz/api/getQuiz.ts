import type { Quiz, QuizDto } from "@/features/quiz/types/quizzes.ts"
import { apiGet } from "@/shared/utils/apiClient.ts"
import toQuiz from "@/features/quiz/mapper/toQuiz.ts"

/** Fetches a single quiz by id (`GET /quizzes/{quizId}`). */
export default async function getQuiz(quizId: string): Promise<Quiz> {
    const dto = await apiGet<QuizDto>(`/quizzes/${quizId}`)
    return toQuiz(dto)
}
