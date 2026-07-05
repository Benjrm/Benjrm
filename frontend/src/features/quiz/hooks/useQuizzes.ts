import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { Quiz } from "@/features/quiz/types/quizzes.ts"
import getQuizzes from "@/features/quiz/api/getQuizzes.ts"

import quizKeys from "@/features/quiz/utils/quizKeys.ts"

/** Loads all quizzes owned by the current user. */
export default function useQuizzes(): UseQueryResult<Quiz[]> {
    return useQuery({
        queryKey: quizKeys.lists(),
        queryFn: async (): Promise<Quiz[]> => getQuizzes(),
    })
}
