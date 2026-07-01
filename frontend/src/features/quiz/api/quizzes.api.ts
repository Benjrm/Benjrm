import type { NewQuiz, Quiz, QuizDto, UpdateQuiz } from "@/features/quiz/types/quizzes.types.ts"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/utils/client.ts"
import toQuiz from "@/features/quiz/mapper/quizzes.mapper.ts"

export async function createQuiz(data: NewQuiz): Promise<Quiz> {
    const dto = await apiPost<QuizDto>("/quizzes", data)
    return toQuiz(dto)
}

export async function updateQuiz(quizId: string, data: UpdateQuiz): Promise<Quiz> {
    const dto = await apiPatch<QuizDto>(`/quizzes/${quizId}`, data)
    return toQuiz(dto)
}

export async function getQuizzes(): Promise<Quiz[]> {
    const dto = await apiGet<QuizDto[]>("/quizzes")
    return dto.map(toQuiz)
}

export async function getQuiz(quizId: string): Promise<Quiz> {
    const dto = await apiGet<QuizDto>(`/quizzes/${quizId}`)
    return toQuiz(dto)
}

export async function deleteQuiz(quizId: string): Promise<void> {
    return apiDelete(`/quizzes/${quizId}`)
}
