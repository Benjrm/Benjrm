import { apiDelete } from "@/shared/utils/client.ts"

export default async function deleteQuiz(quizId: string): Promise<void> {
    return apiDelete(`/quizzes/${quizId}`)
}
