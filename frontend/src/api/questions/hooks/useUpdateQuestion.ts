import { useMutation, type UseMutationResult, useQueryClient } from "@tanstack/react-query"
import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl.ts"
import questionKeys from "@/api/questions/utils/questionKeys.ts"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"

interface UpdateQuestionArgs {
    questionId: string
    request: Partial<QuestionApiRequest>
}

export default function useUpdateQuestion(
    quizId?: string
): UseMutationResult<QuestionApiResponse, Error, UpdateQuestionArgs> {
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
