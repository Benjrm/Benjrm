import type { JSX } from "react"
import { useTranslation } from "react-i18next"

interface ErrorPageProps {
    title: string
}

export default function ErrorPage({ title }: ErrorPageProps): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
            <div className="max-w-md space-y-4 text-center">
                <h1 className="text-5xl font-bold text-[#00F2FF]">{title}</h1>
                <p className="text-muted-foreground text-lg">{t("common.errors.notFound")}</p>
            </div>
        </div>
    )
}
