import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import questionAdapterImpl from "@/features/question/adapter/questionAdapterImpl.ts"
import questionKeys from "@/features/question/utils/questionKeys.ts"
import type { Question, UpdateQuestionRequest } from "@/features/question/types/questions.types.ts"

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
