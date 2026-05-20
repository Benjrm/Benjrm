import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import type { JSX } from "react"
import { useNavigate } from "react-router"
import MarkdownPageComponent from "@/components/markdown/MarkdownPageComponent"

const fetchImprintContent = async (): Promise<string> => {
    const response = await fetch("/imprint.md")
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""

    // Accept Markdown or plain text, but reject HTML fallback responses.
    if (
        !response.ok ||
        contentType.includes("text/html") ||
        (!contentType.includes("text/markdown") && !contentType.includes("text/plain"))
    ) {
        throw Error("Imprint content not found")
    }
    return response.text()
}

export default function ImprintPage(): JSX.Element | null {
    const navigate = useNavigate()
    const {
        data: imprintContent,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["imprint"],
        queryFn: fetchImprintContent,
    })

    useEffect(() => {
        // Redirect on error to 404 page
        if (error) {
            navigate("/404", { replace: true })
        }
    }, [error, navigate])

    /** Loading Screen */
    if (isLoading) {
        return (
            <div className="bg-background text-foreground min-h-full overflow-x-hidden">
                <div className="flex min-h-100 flex-col items-center justify-center gap-4">
                    <Loader2 className="text-primary h-10 w-10 animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Loading Imprint...</p>
                </div>
            </div>
        )
    }

    if (error) {
        // We redirect to 404 page in case of an error.
        return null
    }

    /** Imprint Page */
    return (
        <div className="bg-background text-foreground min-h-full overflow-x-hidden">
            <MarkdownPageComponent content={imprintContent ?? ""} />
        </div>
    )
}
