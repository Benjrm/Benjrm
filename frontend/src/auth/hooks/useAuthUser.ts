import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

/** Currently authenticated user, as reported by the backend session. */
interface AuthUser {
    id: string
    /** URL to the identity provider's account management page, if configured (`OIDC_ACCOUNT_URL`). */
    accountUrl: string | null
}

/**
 * Loads the currently authenticated user from the backend session
 * (`GET /auth/user`). Does not retry on failure, so an unauthenticated
 * session resolves quickly into an error state (see `AuthGuard`).
 */
export default function useAuthUser(): UseQueryResult<AuthUser> {
    return useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/auth/user")
            if (!res.ok) throw new Error("Not authenticated")
            return res.json() as Promise<AuthUser>
        },
        retry: false,
    })
}
