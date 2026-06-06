import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl.ts"
import questionKeys from "@/api/questions/utils/questionKeys.ts"

export default function useCreateQuestion(
    quizId?: string
): UseMutationResult<QuestionApiResponse, Error, QuestionApiRequest> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (request: QuestionApiRequest) => {
            if (!quizId) {
                throw new Error(
                    `POST /api/v1/quizzes/{quizId}/questions requires quizId, given quizId=${quizId}`
                )
            }
            return questionAdapterImpl.createQuestion(quizId, request)
        },
        onSuccess: async () => {
            if (quizId) {
                return queryClient.invalidateQueries({ queryKey: questionKeys.all(quizId) })
            }
            return Promise.reject()
        },
    })
}
