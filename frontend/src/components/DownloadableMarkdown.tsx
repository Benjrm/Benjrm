import { Loader2, Download } from "lucide-react"
import type { JSX } from "react"
import { Navigate } from "react-router"
import { useTranslation } from "react-i18next"
import MarkdownPageComponent from "@/components/markdown/MarkdownPageComponent"
import useMarkdown from "@/hooks/useMarkdown"
import { Button } from "@/shadcn/components/ui/button"

interface Props {
    filename: string
    displayName: string
}

export default function DownloadableMarkdown({ filename, displayName }: Props): JSX.Element | null {
    const { t } = useTranslation()
    const { data: content, isLoading, error } = useMarkdown(filename, displayName)

    if (isLoading) {
        return (
            <div className="bg-background text-foreground min-h-full overflow-x-hidden">
                <div className="flex min-h-[100vh] flex-col items-center justify-center gap-4">
                    <Loader2 className="text-primary h-10 w-10 animate-spin" />
                    <p className="text-muted-foreground animate-pulse">
                        {t("common.loading", { name: displayName })}
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return <Navigate replace to="/404" />
    }

    return (
        <div className="bg-background text-foreground min-h-full overflow-x-hidden">
            <div className="flex justify-end p-4">
                <Button asChild disabled={!content}>
                    <a download href={`/${filename}`}>
                        {t("common.download", { name: displayName })}
                        <Download className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>

            <MarkdownPageComponent content={content ?? ""} />
        </div>
    )
}
