import type { JSX } from "react"
import MarkdownPageComponent from "@/shared/views/markdown/MarkdownPageComponent"

interface QuestionContainerProps {
    question: string | undefined
}

export default function QuestionContainer({
    question,
}: Readonly<QuestionContainerProps>): JSX.Element {
    return (
        <div className="bg-muted/30 relative overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="text-center text-xl font-extrabold [&_p]:text-center [&_p]:text-3xl [&_p]:leading-tight [&_p]:font-bold md:[&_p]:text-4xl">
                <MarkdownPageComponent content={question ?? "Loading question..."} />
            </div>
        </div>
    )
}
