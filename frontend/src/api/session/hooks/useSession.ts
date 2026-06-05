import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

import sessionKeys from "@/api/session/sessionKeys"
import { getSession } from "@/api/session"
import type { Session } from "@/api/session"

export default function useSession(code: string | undefined): UseQueryResult<Session> {
    return useQuery({
        queryKey: code ? sessionKeys.detail(code) : [],
        queryFn: async (): Promise<Session> => {
            if (!code) throw new Error("No session code provided")
            return getSession(code)
        },
        enabled: !!code,
        staleTime: 5 * 60 * 1000,
    })
}
