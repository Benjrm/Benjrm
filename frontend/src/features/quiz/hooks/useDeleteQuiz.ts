import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import useQuestionQueueStorage from "@/features/question/hooks/useQuestionQueueStorage.ts"
import deleteQuiz from "@/features/quiz/api/deleteQuiz.ts"

import quizKeys from "@/features/quiz/utils/quizKeys.ts"

/**
 * Mutation to delete a quiz. On success, invalidates the quiz list and
 * removes any locally queued/persisted question changes for that quiz
 * (see {@link useQuestionQueueStorage}), since they'd otherwise be orphaned.
 */
export default function useDeleteQuiz(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient()
    const queueStorage = useQuestionQueueStorage()
    return useMutation({
        mutationFn: async (quizId: string): Promise<void> => deleteQuiz(quizId),
        onSuccess: (_data, quizId) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
            queueStorage.delete(quizId)
        },
    })
}
