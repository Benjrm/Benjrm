import type { Quiz, QuizDto } from "@/features/quiz/types/quizzes.ts"
import { apiGet } from "@/shared/utils/apiClient.ts"
import toQuiz from "@/features/quiz/mapper/toQuiz.ts"

/** Fetches all quizzes owned by the current user (`GET /quizzes`). */
export default async function getQuizzes(): Promise<Quiz[]> {
    const dto = await apiGet<QuizDto[]>("/quizzes")
    return dto.map(toQuiz)
}
