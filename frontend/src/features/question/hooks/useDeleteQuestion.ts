import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import questionAdapterImpl from "@/features/question/adapter/questionAdapterImpl.ts"
import questionKeys from "@/features/question/utils/questionKeys.ts"

export default function useDeleteQuestion(quizId?: string): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (questionId: string): Promise<void> => {
            if (!quizId) {
                throw new Error(
                    `DELETE /api/v1/quizzes/{quizId}/questions/{questionId} requires quizId and questionId, given quizId=${quizId}; questionId=${questionId}`
                )
            }
            return questionAdapterImpl.deleteQuestion(quizId, questionId)
        },
        onSuccess: async () => {
            if (quizId) {
                return queryClient.invalidateQueries({ queryKey: questionKeys.all(quizId) })
            }
            return Promise.reject()
        },
    })
}
