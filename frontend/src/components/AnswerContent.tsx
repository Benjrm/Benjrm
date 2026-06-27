import type { JSX } from "react"
import { useState } from "react"
import { Maximize2 } from "lucide-react"
import MDEditor from "@uiw/react-md-editor"
import { Button } from "@/shadcn/components/ui/button"
import { Input } from "@/shadcn/components/ui/input"
import { Textarea } from "@/shadcn/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"
import { useTheme } from "@/context/ThemeContext"

interface AnswerContentProps {
    value: string
    onChange: (val: string) => void
    placeholder: string
    error: boolean
    isMdEditor: boolean
    singleLine?: boolean
}

export default function AnswerContent({
    value,
    onChange,
    placeholder,
    error,
    isMdEditor,
    singleLine = false,
}: AnswerContentProps): JSX.Element {
    const { theme } = useTheme()
    const [isExpanded, setIsExpanded] = useState(false)

    const colorMode = theme === "auto" ? "auto" : theme
    const wrapperClass = `[&_.w-md-editor-toolbar]:!border-border overflow-hidden rounded-xl border shadow-sm [&_.w-md-editor]:!shadow-none [&_.w-md-editor-text]:h-full [&_.w-md-editor-toolbar]:!border-b [&_.w-md-editor-toolbar]:!bg-transparent [&_.wmde-markdown-color]:!bg-transparent ${
        error ? "border-red-400 dark:border-red-400/30" : "border-border"
    }`
    const editorClass = error ? "bg-red-50! dark:bg-red-500/10!" : "bg-muted/90! dark:bg-muted/25!"

    function renderInput(): JSX.Element {
        if (isMdEditor) {
            return (
                <>
                    <div className={wrapperClass} data-color-mode={colorMode}>
                        <MDEditor
                            className={editorClass}
                            height={140}
                            onChange={(val) => onChange(val ?? "")}
                            preview="edit"
                            textareaProps={{ placeholder }}
                            value={value}
                        />
                    </div>

                    <div className="mt-1 flex justify-end">
                        <Button
                            aria-label="Expand editor"
                            className="h-6 gap-1 px-2 text-[10px] opacity-60 hover:opacity-100"
                            onClick={() => setIsExpanded(true)}
                            size="sm"
                            type="button"
                            variant="ghost"
                        >
                            <Maximize2 className="h-3 w-3" />
                            Expand
                        </Button>
                    </div>

                    <Dialog onOpenChange={setIsExpanded} open={isExpanded}>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Edit Answer</DialogTitle>
                            </DialogHeader>
                            <div className={wrapperClass} data-color-mode={colorMode}>
                                <MDEditor
                                    className={editorClass}
                                    height={400}
                                    onChange={(val) => onChange(val ?? "")}
                                    preview="edit"
                                    textareaProps={{ placeholder }}
                                    value={value}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )
        }

        if (singleLine) {
            return (
                <Input
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    value={value}
                    className={`text-foreground h-12 rounded-xl text-base font-semibold shadow-none ${
                        error
                            ? "border-red-400! bg-red-50 dark:border-red-400/30! dark:bg-red-500/10"
                            : "border-border/40 bg-background/80"
                    }`}
                />
            )
        }

        return (
            <Textarea
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={2}
                style={{ fieldSizing: "fixed" }}
                value={value}
                className={`placeholder:text-muted-foreground/60 h-28 w-full resize-none overflow-y-auto p-4 text-lg leading-7 font-semibold shadow-none focus-visible:ring-0 sm:h-24 sm:text-lg ${
                    error
                        ? "border-red-400! bg-red-50 dark:border-red-400/30! dark:bg-red-500/10"
                        : "bg-muted/90 dark:bg-muted/25 border-none"
                }`}
            />
        )
    }

    return (
        <div className="relative w-full">
            {renderInput()}

            {error ? (
                <div className="absolute right-0 bottom-0 left-0 mx-2 mb-1 text-sm font-medium text-red-500">
                    This field is required
                </div>
            ) : null}
        </div>
    )
}
