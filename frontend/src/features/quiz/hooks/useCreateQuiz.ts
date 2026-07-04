import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { NewQuiz, Quiz } from "@/features/quiz/types/quizzes.ts"
import createQuiz from "@/features/quiz/api/createQuiz.ts"

import quizKeys from "@/features/quiz/utils/quizKeys.ts"

export default function useCreateQuiz(): UseMutationResult<Quiz, Error, NewQuiz> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: NewQuiz): Promise<Quiz> => createQuiz(data),
        onSuccess: (quiz) => {
            queryClient.setQueryData(quizKeys.detail(quiz.id), quiz)
            queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
        },
    })
}
