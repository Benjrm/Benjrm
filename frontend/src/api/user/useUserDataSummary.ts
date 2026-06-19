import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

export interface DataSummary {
    quizCount: number
    questionCount: number
}

export default function useUserDataSummary(enabled: boolean): UseQueryResult<DataSummary> {
    return useQuery({
        queryKey: ["userDataSummary"],
        queryFn: async () => {
            const res = await fetch("/auth/user/data-summary")
            if (!res.ok) throw new Error("Failed to fetch data summary")
            return res.json() as Promise<DataSummary>
        },
        enabled,
    })
}
