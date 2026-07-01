import type { Quiz, QuizDto } from "@/features/quiz/types/quizzes.ts"
import { apiGet } from "@/shared/utils/client.ts"
import toQuiz from "@/features/quiz/mapper/toQuiz.ts"

export default async function getQuiz(quizId: string): Promise<Quiz> {
    const dto = await apiGet<QuizDto>(`/quizzes/${quizId}`)
    return toQuiz(dto)
}
