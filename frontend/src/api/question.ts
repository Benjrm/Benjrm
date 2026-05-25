import { apiDelete } from "@/api/client.ts"

export default async function deleteQuestion(quizId: string, questionId: string): Promise<void> {
    return apiDelete(`quizzes/${quizId}/questions/${questionId}`)
}
