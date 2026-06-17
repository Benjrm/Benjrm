// frontend/src/api/session/hooks/useSessionPlayers.ts

import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

import sessionKeys from "../sessionKeys"
import { getSessionPlayers } from "@/api/session"
import type { SessionPlayer } from "@/api/session"

/**
 * Hook to get the current player list for a session.
 * Note: GET /api/v1/sessions/{code}/players is host-only. (403 if not the host)
 * @param code The session code.
 * @returns The list of players who have set a name.
 */
export default function useSessionPlayers(
    code: number | undefined
): UseQueryResult<SessionPlayer[]> {
    return useQuery({
        queryKey: code !== undefined ? sessionKeys.players(code) : [],
        queryFn: async (): Promise<SessionPlayer[]> => {
            if (code === undefined) throw new Error("No session code provided")
            return getSessionPlayers(code)
        },
        enabled: code !== undefined,
        staleTime: Infinity,
    })
}
