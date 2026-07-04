import { useQuery } from "@tanstack/react-query"

/**
 * Fetches a markdown/plain-text document from the static file server.
 *
 * @param filename - Path (relative to the site root) of the document to fetch.
 * @param displayName - Human-readable name used in the thrown error message.
 * @throws {Error} If the response is missing, HTML, or not markdown/plain text
 * (e.g. the SPA's catch-all route serving `index.html` for a missing file).
 */
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

/**
 * Loads and caches a markdown/plain-text document (e.g. imprint or privacy
 * policy) via {@link fetchMarkdownContent}, wrapped in a TanStack Query.
 *
 * @param filename - Path (relative to the site root) of the document to fetch.
 * @param displayName - Human-readable name used in error messages.
 */
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
