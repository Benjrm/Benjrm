import type { JSX } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { Badge } from "@/shadcn/components/ui/badge"
import { Separator } from "@/shadcn/components/ui/separator"

interface MarkdownPageComponentProps {
    content: string
}

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-foreground mt-10 mb-6 scroll-m-20 text-5xl font-bold tracking-tight first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-foreground mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-foreground mt-6 mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-foreground mt-4 mb-2 scroll-m-20 text-lg font-semibold tracking-tight">
            {children}
        </h4>
    ),
    h5: ({ children }) => (
        <h5 className="text-foreground mt-4 mb-2 scroll-m-20 text-base font-semibold tracking-tight">
            {children}
        </h5>
    ),
    h6: ({ children }) => (
        <h6 className="text-foreground mt-4 mb-2 scroll-m-20 text-sm font-semibold tracking-tight">
            {children}
        </h6>
    ),
    p: ({ children }) => (
        <p className="text-muted-foreground mb-4 leading-7 [&:not(:first-child)]:mt-4">
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="text-muted-foreground my-4 ml-6 list-disc space-y-2 [&>li]:mt-2">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="text-muted-foreground my-4 ml-6 list-decimal space-y-2 [&>li]:mt-2">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    a: ({ href, children }) => (
        <a
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
            href={href}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            target={href?.startsWith("http") ? "_blank" : undefined}
        >
            {children}
        </a>
    ),
    strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => (
        <blockquote className="border-primary text-muted-foreground mt-6 border-l-2 pl-6 italic">
            {children}
        </blockquote>
    ),
    hr: () => <Separator className="my-8" />,
    code: ({ children, className }) => {
        const isInline = !className
        if (isInline) {
            return (
                <Badge className="px-1.5 py-0.5 font-mono text-xs" variant="secondary">
                    {children}
                </Badge>
            )
        }

        return (
            <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {children}
            </code>
        )
    },
    pre: ({ children }) => (
        <pre className="bg-muted mt-4 mb-4 overflow-x-auto rounded-lg border p-4">{children}</pre>
    ),
    table: ({ children }) => (
        <div className="my-6 w-full overflow-y-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="border-b">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
        <tr className="hover:bg-muted/50 border-b transition-colors">{children}</tr>
    ),
    th: ({ children }) => (
        <th className="text-muted-foreground h-10 px-4 text-left align-middle font-medium">
            {children}
        </th>
    ),
    td: ({ children }) => <td className="text-muted-foreground p-4 align-middle">{children}</td>,
}

export default function MarkdownPageComponent({
    content,
}: MarkdownPageComponentProps): JSX.Element {
    return (
        <div className="mx-auto max-w-4xl px-4 py-2 sm:px-6 md:py-8">
            <article>
                <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
            </article>
        </div>
    )
}
