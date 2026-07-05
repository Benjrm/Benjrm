import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import questionKeys from "@/features/question/utils/questionKeys.ts"
import questionAdapterImpl from "@/features/question/adapter/questionAdapterImpl.ts"
import type { Question } from "@/features/question/types/questions.ts"

/**
 * Loads all questions of a quiz, each fetched individually to get full
 * question detail (the list endpoint returns summaries only).
 *
 * @param quizId - Id of the quiz to load questions for. The query is
 * disabled while `undefined`.
 */
export default function useQuestions(quizId?: string): UseQueryResult<Question[]> {
    return useQuery({
        queryKey: quizId ? questionKeys.all(quizId) : [],
        enabled: !!quizId,
        queryFn: async () => {
            if (!quizId) {
                throw new Error(
                    `GET /api/v1/quizzes/{quizId}/questions requires quizId, given quizId=${quizId}`
                )
            }
            const questions = await questionAdapterImpl.getQuestions(quizId)
            return Promise.all(
                questions.map(async (question) =>
                    questionAdapterImpl.getQuestion(quizId, question.id)
                )
            )
        },
    })
}
