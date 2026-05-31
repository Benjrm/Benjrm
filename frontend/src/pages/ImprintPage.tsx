import { Loader2, Download } from "lucide-react"
import type { JSX } from "react"
import { Navigate } from "react-router"
import MarkdownPageComponent from "@/components/markdown/MarkdownPageComponent"
import useImprint from "@/hooks/useImprint"
import { Button } from "@/shadcn/components/ui/button"

/** Imprint Page */

export default function ImprintPage(): JSX.Element | null {
    const { data: imprintContent, isLoading, error } = useImprint()

    /** Loading Screen */
    if (isLoading) {
        return (
            <div className="bg-background text-foreground min-h-full overflow-x-hidden">
                <div className="flex min-h-[100vh] flex-col items-center justify-center gap-4">
                    <Loader2 className="text-primary h-10 w-10 animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Loading Imprint...</p>
                </div>
            </div>
        )
    }

    if (error) {
        // We redirect to 404 page in case of an error.
        return <Navigate replace to="/404" />
    }

    /** Imprint Page */
    return (
        <div className="bg-background text-foreground min-h-full overflow-x-hidden">
            <div className="flex justify-end p-4">
                <Button asChild disabled={!imprintContent}>
                    <a download href="/imprint.md">
                        Download Imprint <Download className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
            <MarkdownPageComponent content={imprintContent ?? ""} />
        </div>
    )
}
