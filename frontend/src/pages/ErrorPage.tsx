// frontend/src/pages/ErrorPage.tsx

import type { JSX } from "react"

interface ErrorPageProps {
    title: string
    message: string
}

export default function ErrorPage({ title, message }: ErrorPageProps): JSX.Element {
    return (
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
            <div className="max-w-md space-y-4 text-center">
                <h1 className="text-5xl font-bold text-[#00F2FF]">{title}</h1>
                <p className="text-muted-foreground text-lg">{message}</p>
            </div>
        </div>
    )
}
