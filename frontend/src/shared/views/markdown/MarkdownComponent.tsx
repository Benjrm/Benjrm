import type { JSX } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import sanitizeSchema from "../../utils/sanitizeSchema.ts"
import markdownComponents from "./markdownComponents"

interface MarkdownComponentProps {
    content: string
}

export default function MarkdownComponent({
    content,
}: Readonly<MarkdownComponentProps>): JSX.Element {
    return (
        <div>
            <ReactMarkdown
                components={markdownComponents}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                remarkPlugins={[remarkGfm]}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
