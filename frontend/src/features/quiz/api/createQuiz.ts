import type { NewQuiz, Quiz, QuizDto } from "@/features/quiz/types/quizzes.ts"
import { apiPost } from "@/shared/utils/apiClient.ts"
import toQuiz from "@/features/quiz/mapper/toQuiz.ts"

/** Creates a new quiz owned by the current user (`POST /quizzes`). */
export default async function createQuiz(data: NewQuiz): Promise<Quiz> {
    const dto = await apiPost<QuizDto>("/quizzes", data)
    return toQuiz(dto)
}
