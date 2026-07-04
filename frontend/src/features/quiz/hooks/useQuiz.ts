import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { Quiz } from "@/features/quiz/types/quizzes.ts"
import getQuiz from "@/features/quiz/api/getQuiz.ts"

import quizKeys from "@/features/quiz/utils/quizKeys.ts"

export default function useQuiz(quizId: string | undefined): UseQueryResult<Quiz> {
    return useQuery({
        queryKey: quizId ? quizKeys.detail(quizId) : [],
        queryFn: async (): Promise<Quiz> => {
            if (!quizId) throw new Error("No quiz ID")
            return getQuiz(quizId)
        },
        enabled: !!quizId,
    })
}
