import { apiDelete } from "@/shared/utils/apiClient.ts"

/** Deletes a quiz and all its questions (`DELETE /quizzes/{quizId}`). */
export default async function deleteQuiz(quizId: string): Promise<void> {
    return apiDelete(`/quizzes/${quizId}`)
}
