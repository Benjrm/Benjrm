import { useEffect } from "react"
import type { JSX } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import markdownComponents from "./markdownComponents"
import sanitizeSchema from "./sanitizeSchema"

interface MarkdownPageComponentProps {
    content: string
}

export default function MarkdownPageComponent({
    content,
}: MarkdownPageComponentProps): JSX.Element {
    // Scroll to the element specified in the URL hash when the content changes
    useEffect(() => {
        const { hash } = window.location
        if (hash) {
            setTimeout(() => {
                const id = hash.substring(1)
                const element = document.getElementById(id)
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" })
                }
            }, 100)
        }
    }, [content])
    return (
        <div className="mx-auto max-w-4xl px-4 py-2 sm:px-6 md:py-8">
            <article>
                <ReactMarkdown
                    components={markdownComponents}
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                    remarkPlugins={[remarkGfm]}
                >
                    {content}
                </ReactMarkdown>
            </article>
        </div>
    )
}
