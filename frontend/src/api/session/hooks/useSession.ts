// frontend/src/api/session/hooks/useSession.ts

import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

import sessionKeys from "../sessionKeys"
import { getSession } from "@/api/session"
import type { Session } from "@/api/session"

/**
 * Hook to get a session by code.
 * Note: GET /api/v1/sessions/{code} is host-only (403 for players).
 * @param code The session code.
 * @returns The session.
 */
export default function useSession(code: number | undefined): UseQueryResult<Session> {
    return useQuery({
        queryKey: code !== undefined ? sessionKeys.detail(code) : [],
        queryFn: async (): Promise<Session> => {
            if (code === undefined) throw new Error("No session code provided")
            return getSession(code)
        },
        enabled: code !== undefined,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}
