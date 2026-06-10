// frontend/src/api/session/hooks/useSessionQuiz.ts

import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

import sessionKeys from "../sessionKeys"
import { getSessionQuiz } from "@/api/session"
import type { Quiz } from "@/api/quiz"

/**
 * Hook to get the quiz in a session.
 * Note: GET /api/v1/sessions/{code}/quiz is also host-only. (403 Client is not the host)
 * @param code The session code.
 * @returns The quiz.
 */
export default function useSessionQuiz(code: number | undefined): UseQueryResult<Quiz> {
    return useQuery({
        queryKey: code !== undefined ? sessionKeys.quiz(code) : [],
        queryFn: async (): Promise<Quiz> => {
            if (code === undefined) throw new Error("No session code provided")
            return getSessionQuiz(code)
        },
        enabled: code !== undefined,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}
