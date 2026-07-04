import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { Quiz } from "@/features/quiz/types/quizzes.ts"
import getQuiz from "@/features/quiz/api/getQuiz.ts"

import quizKeys from "@/features/quiz/utils/quizKeys.ts"

/**
 * Loads a single quiz by id. The query is disabled while `quizId` is `undefined`
 * (e.g. a not-yet-created quiz in the editor).
 */
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
