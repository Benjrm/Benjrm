import type { JSX } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import markdownComponents from "./markdownComponents"
import sanitizeSchema from "./sanitizeSchema"

interface MarkdownComponentProps {
    content: string
}

export default function MarkdownComponent({ content }: MarkdownComponentProps): JSX.Element {
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
