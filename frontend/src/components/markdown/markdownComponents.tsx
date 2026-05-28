import type { JSX, ReactNode } from "react"
import { isValidElement } from "react"
import type { Components } from "react-markdown"
import Highlight, { defaultProps } from "prism-react-renderer"
import type { Language } from "prism-react-renderer"
import duotoneTheme from "prism-react-renderer/themes/duotoneDark"
import { Separator } from "@/shadcn/components/ui/separator"
import { cn } from "@/shadcn/lib/utils"

function codeBlock({
    className,
    language,
    children,
}: {
    className?: string
    language?: string
    children?: ReactNode
}): JSX.Element {
    const code = String(children).replace(/\n$/, "")
    const match = /language-(\w+)/.exec(className ?? "")
    const resolvedLanguage = language ?? match?.[1] ?? "markup"

    return (
        <Highlight
            {...defaultProps}
            code={code}
            language={resolvedLanguage as Language}
            theme={duotoneTheme}
        >
            {({ className: preClassName, tokens, getLineProps, getTokenProps }) => (
                <pre
                    className={cn(
                        "bg-muted mt-4 mb-4 overflow-x-auto rounded-lg border p-4 whitespace-pre",
                        preClassName
                    )}
                >
                    {tokens.map((line, i) => {
                        const { key: lineKey, ...lineRest } = getLineProps({ line, key: i })
                        return (
                            <div key={lineKey} {...lineRest}>
                                {line.map((token, j) => {
                                    const { key: tokenKey, ...tokenRest } = getTokenProps({
                                        token,
                                        key: j,
                                    })
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
    className,
    children,
    ...props
}: { level: 1 | 2 | 3 | 4 | 5 | 6; children?: ReactNode } & Omit<
    React.ComponentPropsWithoutRef<"h1">,
    "children"
>) {
    const Tag = `h${level}` as const
    const variants = {
        1: "mt-10 mb-6 text-5xl font-bold first:mt-0",
        2: "mt-8 mb-4 text-3xl font-semibold first:mt-0",
        3: "mt-6 mb-3 text-xl font-semibold",
        4: "mt-4 mb-2 text-lg font-semibold",
        5: "mt-4 mb-2 text-base font-semibold",
        6: "mt-4 mb-2 text-sm font-semibold",
    }

    return (
        <Tag
            className={cn(
                `text-foreground scroll-m-20 tracking-tight ${variants[level]}`,
                className
            )}
            {...props}
        >
            {children}
        </Tag>
    )
}

const markdownComponents: Components = {
    h1: ({ node: _, ...props }) => markdownHeading({ level: 1, ...props }),
    h2: ({ node: _, ...props }) => markdownHeading({ level: 2, ...props }),
    h3: ({ node: _, ...props }) => markdownHeading({ level: 3, ...props }),
    h4: ({ node: _, ...props }) => markdownHeading({ level: 4, ...props }),
    h5: ({ node: _, ...props }) => markdownHeading({ level: 5, ...props }),
    h6: ({ node: _, ...props }) => markdownHeading({ level: 6, ...props }),

    p: ({ node: _, className, ...props }) => (
        <p
            className={cn("text-muted-foreground mb-4 leading-7 not-first:mt-4", className)}
            {...props}
        />
    ),

    ul: ({ node: _, className, ...props }) => (
        <ul
            className={cn(
                "text-muted-foreground my-4 ml-6 list-disc space-y-2 [&>li]:mt-2",
                className
            )}
            {...props}
        />
    ),

    ol: ({ node: _, className, ...props }) => (
        <ol
            className={cn(
                "text-muted-foreground my-4 ml-6 list-decimal space-y-2 [&>li]:mt-2",
                className
            )}
            {...props}
        />
    ),

    li: ({ node: _, className, ...props }) => (
        <li className={cn("leading-7", className)} {...props} />
    ),

    a: ({ node: _, className, href, children, ...props }) => (
        <a
            href={href}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            target={href?.startsWith("http") ? "_blank" : undefined}
            className={cn(
                "text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors",
                className
            )}
            {...props}
        >
            {children}
        </a>
    ),

    strong: ({ node: _, className, ...props }) => (
        <strong className={cn("text-foreground font-semibold", className)} {...props} />
    ),

    em: ({ node: _, className, ...props }) => <em className={cn("italic", className)} {...props} />,

    blockquote: ({ node: _, className, ...props }) => (
        <blockquote
            className={cn(
                "border-primary text-muted-foreground mt-6 border-l-2 pl-6 italic",
                className
            )}
            {...props}
        />
    ),

    hr: ({ node: _, ...props }) => <Separator className="my-8" {...props} />,

    code: ({ node: _, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className ?? "")
        if (match) return codeBlock({ language: match[1], children })

        return (
            <code
                className={cn(
                    "bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-sm font-medium",
                    className
                )}
                {...props}
            >
                {children}
            </code>
        )
    },

    pre: ({ node: _, children, ...props }) => {
        const codeChild = Array.isArray(children) ? children.find(isValidElement) : children
        if (isValidElement(codeChild)) {
            const childProps = codeChild.props as { className?: string; children?: ReactNode }
            return codeBlock({
                className: childProps.className,
                children: childProps.children,
            })
        }
        return <pre {...props}>{children}</pre>
    },

    input: ({ node: _, type, checked, disabled, ...props }) => (
        <input
            defaultChecked={type === "checkbox" ? Boolean(checked) : undefined}
            disabled={type === "checkbox" ? true : Boolean(disabled)}
            type={type}
            {...props}
        />
    ),

    table: ({ node: _, className, children, ...props }) => (
        <div className={cn("my-6 w-full overflow-y-auto", className)} {...props}>
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),

    thead: ({ node: _, className, ...props }) => (
        <thead className={cn("border-b", className)} {...props} />
    ),
    tbody: ({ node: _, className, ...props }) => <tbody className={className} {...props} />,
    tr: ({ node: _, className, ...props }) => (
        <tr className={cn("hover:bg-muted/50 border-b transition-colors", className)} {...props} />
    ),
    th: ({ node: _, className, ...props }) => (
        <th
            className={cn(
                "text-muted-foreground h-10 px-4 text-left align-middle font-medium",
                className
            )}
            {...props}
        />
    ),
    td: ({ node: _, className, ...props }) => (
        <td className={cn("text-muted-foreground p-4 align-middle", className)} {...props} />
    ),

    section: ({ node: _, ...props }) => <section {...props} />,
}

export default markdownComponents
