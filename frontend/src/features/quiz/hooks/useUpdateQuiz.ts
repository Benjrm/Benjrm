import type { UseMutationResult } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Quiz, UpdateQuiz } from "@/features/quiz/types/quizzes.ts"
import updateQuiz from "@/features/quiz/api/updateQuiz.ts"
import quizKeys from "@/features/quiz/utils/quizKeys.ts"

/**
 * Mutation to partially update a quiz. On success, seeds the query cache
 * with the updated quiz and invalidates the quiz list. The mutation throws
 * if `quizId` is `undefined` when triggered.
 */
export default function useUpdateQuiz(
    quizId: string | undefined
): UseMutationResult<Quiz, Error, UpdateQuiz> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: UpdateQuiz): Promise<Quiz> => {
            if (!quizId) throw new Error("No quiz ID")
            return updateQuiz(quizId, data)
        },
        onSuccess: (quiz) => {
            if (quizId) {
                queryClient.setQueryData(quizKeys.detail(quizId), quiz)
                queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
            }
        },
    })
}
