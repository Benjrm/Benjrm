import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl.ts"
import questionKeys from "@/api/questions/utils/questionKeys.ts"
import type { Question, UpdateQuestionRequest } from "@/api/questions/questions.types.ts"

interface UpdateQuestionArgs {
    questionId: string
    request: Partial<UpdateQuestionRequest>
}

export default function useUpdateQuestion(
    quizId?: string
): UseMutationResult<Question, Error, UpdateQuestionArgs> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (args: UpdateQuestionArgs) => {
            if (!quizId) {
                throw new Error(
                    `PATCH /api/v1/quizzes/{quizId}/questions/{questionId} requires quizId and questionId, given quizId=${quizId}; questionId=${args.questionId}`
                )
            }
            return questionAdapterImpl.updateQuestion(quizId, args.questionId, args.request)
        },
        onSuccess: async () => {
            if (quizId) {
                return queryClient.invalidateQueries({ queryKey: questionKeys.all(quizId) })
            }
            return Promise.reject()
        },
    })
}
