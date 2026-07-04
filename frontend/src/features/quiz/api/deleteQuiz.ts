import { apiDelete } from "@/shared/utils/apiClient.ts"

export default async function deleteQuiz(quizId: string): Promise<void> {
    return apiDelete(`/quizzes/${quizId}`)
}
