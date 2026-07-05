import type { Quiz, QuizDto, UpdateQuiz } from "@/features/quiz/types/quizzes.ts"
import { apiPatch } from "@/shared/utils/apiClient.ts"
import toQuiz from "@/features/quiz/mapper/toQuiz.ts"

/** Partially updates a quiz (`PATCH /quizzes/{quizId}`). */
export default async function updateQuiz(quizId: string, data: UpdateQuiz): Promise<Quiz> {
    const dto = await apiPatch<QuizDto>(`/quizzes/${quizId}`, data)
    return toQuiz(dto)
}
