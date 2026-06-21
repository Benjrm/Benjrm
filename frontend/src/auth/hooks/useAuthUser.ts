import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

export interface AuthUser {
    id: string
    accountUrl: string | null
}

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
