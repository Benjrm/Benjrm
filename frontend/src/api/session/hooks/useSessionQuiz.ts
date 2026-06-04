// frontend/src/api/session/hooks/useSessionQuiz.ts

import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

import sessionKeys from "../sessionKeys"
import { getSessionQuiz } from "@/api/session"
import type { Quiz } from "@/api/quiz"

/**
 * Hook to get the quiz in a session.
 * @param code The session code.
 * @returns The quiz.
 */
export default function useSessionQuiz(code: string | undefined): UseQueryResult<Quiz> {
    return useQuery({
        queryKey: code ? sessionKeys.quiz(code) : [],
        queryFn: async (): Promise<Quiz> => {
            if (!code) throw new Error("No session code provided")
            return getSessionQuiz(code)
        },
        enabled: !!code,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}
