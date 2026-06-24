import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import questionKeys from "@/api/questions/utils/questionKeys.ts"
import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl.ts"
import type { Question } from "@/api/questions/questions.types.ts"

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
