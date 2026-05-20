import { useQuery } from "@tanstack/react-query"

const fetchImprintContent = async (): Promise<string> => {
    const response = await fetch("/imprint.md")
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""

    if (
        !response.ok ||
        contentType.includes("text/html") ||
        (!contentType.includes("text/markdown") && !contentType.includes("text/plain"))
    ) {
        throw Error("Imprint content not found")
    }
    return response.text()
}

export default function useImprint(): {
    data: string | undefined
    isLoading: boolean
    error: unknown
} {
    return useQuery({
        queryKey: ["imprint"],
        queryFn: fetchImprintContent,
    })
}
