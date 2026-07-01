import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import questionAdapterImpl from "@/features/question/adapter/questionAdapterImpl.ts"
import questionKeys from "@/features/question/utils/questionKeys.ts"
import type { Question, QuestionRequest } from "@/features/question/types/questions.types.ts"

export default function useCreateQuestion(
    quizId?: string
): UseMutationResult<Question, Error, QuestionRequest> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (request: QuestionRequest) => {
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
