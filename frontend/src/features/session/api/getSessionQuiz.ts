import type { Quiz, QuizDto } from "@/features/quiz/types/quizzes.ts"
import { apiGet } from "@/shared/utils/apiClient.ts"
import toQuiz from "@/features/quiz/mapper/toQuiz.ts"

export default async function getSessionQuiz(code: number): Promise<Quiz> {
    const dto = await apiGet<QuizDto>(`/sessions/${code}/quiz`)
    return toQuiz(dto)
}
