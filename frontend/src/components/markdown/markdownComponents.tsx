import type { JSX, ReactNode } from "react"
import type { Components } from "react-markdown"
import Highlight, { defaultProps } from "prism-react-renderer"
import type { Language } from "prism-react-renderer"
import duotoneTheme from "prism-react-renderer/themes/duotoneDark"
import { Badge } from "@/shadcn/components/ui/badge"
import { Separator } from "@/shadcn/components/ui/separator"

function inlineCode({ children }: { children?: ReactNode }): JSX.Element {
    return (
        <Badge className="px-1.5 py-0.5 font-mono text-xs" variant="secondary">
            {children}
        </Badge>
    )
}

function codeBlock({
    className,
    children,
}: {
    className?: string
    children?: ReactNode
}): JSX.Element {
    const code = String(children).replace(/\n$/, "")
    const match = /language-(\w+)/.exec(className ?? "")
    const language = match?.[1] ?? ""

    return (
        <Highlight
            {...defaultProps}
            code={code}
            language={language as Language}
            theme={duotoneTheme}
        >
            {({ className: preClassName, tokens, getLineProps, getTokenProps }) => (
                <pre
                    className={`${preClassName} bg-muted mt-4 mb-4 overflow-x-auto rounded-lg border p-4 whitespace-pre`}
                >
                    {tokens.map((line) => {
                        const lineProps = getLineProps({ line }) as { key?: React.Key } & Record<
                            string,
                            unknown
                        >
                        const { key: lineKey, ...lineRest } = lineProps

                        return (
                            <div key={lineKey} {...lineRest}>
                                {line.map((token) => {
                                    const tokenProps = getTokenProps({ token }) as {
                                        key?: React.Key
                                    } & Record<string, unknown>
                                    const { key: tokenKey, ...tokenRest } = tokenProps

                                    return <span key={tokenKey} {...tokenRest} />
                                })}
                            </div>
                        )
                    })}
                </pre>
            )}
        </Highlight>
    )
}

function markdownHeading({
    level,
    children,
}: {
    level: 1 | 2 | 3 | 4 | 5 | 6
    children?: ReactNode
}): JSX.Element {
    const className = {
        1: "text-foreground mt-10 mb-6 scroll-m-20 text-5xl font-bold tracking-tight first:mt-0",
        2: "text-foreground mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0",
        3: "text-foreground mt-6 mb-3 scroll-m-20 text-xl font-semibold tracking-tight",
        4: "text-foreground mt-4 mb-2 scroll-m-20 text-lg font-semibold tracking-tight",
        5: "text-foreground mt-4 mb-2 scroll-m-20 text-base font-semibold tracking-tight",
        6: "text-foreground mt-4 mb-2 scroll-m-20 text-sm font-semibold tracking-tight",
    }[level]

    switch (level) {
        case 1:
            return <h1 className={className}>{children}</h1>
        case 2:
            return <h2 className={className}>{children}</h2>
        case 3:
            return <h3 className={className}>{children}</h3>
        case 4:
            return <h4 className={className}>{children}</h4>
        case 5:
            return <h5 className={className}>{children}</h5>
        case 6:
            return <h6 className={className}>{children}</h6>
        default:
            return <h6 className={className}>{children}</h6>
    }
}

function markdownParagraph({ children }: { children?: ReactNode }): JSX.Element {
    return <p className="text-muted-foreground mb-4 leading-7 not-first:mt-4">{children}</p>
}

function markdownList({
    ordered,
    children,
}: {
    ordered?: boolean
    children?: ReactNode
}): JSX.Element {
    if (ordered) {
        return (
            <ol className="text-muted-foreground my-4 ml-6 list-decimal space-y-2 [&>li]:mt-2">
                {children}
            </ol>
        )
    }

    return (
        <ul className="text-muted-foreground my-4 ml-6 list-disc space-y-2 [&>li]:mt-2">
            {children}
        </ul>
    )
}

function markdownLink({ href, children }: { href?: string; children?: ReactNode }): JSX.Element {
    const isExternal = href?.startsWith("http") ?? false

    return (
        <a
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
            href={href}
            rel={isExternal ? "noopener noreferrer" : undefined}
            target={isExternal ? "_blank" : undefined}
        >
            {children}
        </a>
    )
}

function markdownBlockquote({ children }: { children?: ReactNode }): JSX.Element {
    return (
        <blockquote className="border-primary text-muted-foreground mt-6 border-l-2 pl-6 italic">
            {children}
        </blockquote>
    )
}

function markdownTable({ children }: { children?: ReactNode }): JSX.Element {
    return (
        <div className="my-6 w-full overflow-y-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    )
}

const markdownComponents: Components = {
    h1: ({ children }) => markdownHeading({ level: 1, children }),
    h2: ({ children }) => markdownHeading({ level: 2, children }),
    h3: ({ children }) => markdownHeading({ level: 3, children }),
    h4: ({ children }) => markdownHeading({ level: 4, children }),
    h5: ({ children }) => markdownHeading({ level: 5, children }),
    h6: ({ children }) => markdownHeading({ level: 6, children }),
    p: ({ children }) => markdownParagraph({ children }),
    ul: ({ children }) => markdownList({ children }),
    ol: ({ children }) => markdownList({ ordered: true, children }),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    a: ({ href, children }) => markdownLink({ href, children }),
    strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => markdownBlockquote({ children }),
    hr: () => <Separator className="my-8" />,
    code: (props) => {
        const inline = "inline" in props ? (props as { inline?: boolean }).inline : false
        const { className, children } = props

        return inline ? inlineCode({ children }) : codeBlock({ className, children })
    },
    pre: ({ children }) => (
        <div className="bg-muted mt-4 mb-4 overflow-x-auto rounded-lg border p-4">{children}</div>
    ),
    table: ({ children }) => markdownTable({ children }),
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

export default markdownComponents
