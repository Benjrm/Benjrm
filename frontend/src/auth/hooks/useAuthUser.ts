import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

export default function useAuthUser(): UseQueryResult<boolean> {
    return useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/auth/user")
            if (!res.ok) throw new Error("Not authenticated")
            return true
        },
        retry: false,
    })
}
