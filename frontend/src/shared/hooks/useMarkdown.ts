import { useQuery } from "@tanstack/react-query"

const fetchMarkdownContent = async (filename: string, displayName: string): Promise<string> => {
    const response = await fetch(`/${filename}`)
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""

    if (
        !response.ok ||
        contentType.includes("text/html") ||
        (!contentType.includes("text/markdown") && !contentType.includes("text/plain"))
    ) {
        throw Error(`${displayName} content not found`)
    }
    return response.text()
}

export default function useMarkdown(
    filename: string,
    displayName: string
): {
    data: string | undefined
    isLoading: boolean
    error: unknown
} {
    return useQuery({
        queryKey: ["markdown", filename],
        queryFn: async () => fetchMarkdownContent(filename, displayName),
    })
}
