// frontend/src/components/AnswerCard.tsx

import type { JSX } from "react"
import { Check, Trash2, X } from "lucide-react"
import getAnswerVisuals from "../utils/answerVisuals"
import { Textarea } from "@/shadcn/components/ui/textarea"
import { Button } from "@/shadcn/components/ui/button"

export interface AnswerCardProps {
    // visual props are optional; can be derived from `index`
    icon?: string
    accent?: string
    glow?: string
    index?: number
    error: boolean

    placeholder: string
    value: string
    onChange: (val: string) => void
    onToggleCorrect?: () => void
    correct?: boolean
    onDelete?: () => void
    canDelete?: boolean
}

export default function AnswerCard({
    icon,
    placeholder,
    value,
    onChange,
    onToggleCorrect,
    correct,
    onDelete,
    accent,
    glow,
    canDelete = false,
    index,
    error,
}: AnswerCardProps): JSX.Element {
    // If any visual prop is provided, use provided (with defaults). Otherwise, derive from index when available.
    const hasProvidedVisuals = icon != null || accent != null || glow != null
    let visuals: { accent: string; glow: string; icon: string }

    if (hasProvidedVisuals) {
        visuals = { accent: accent ?? "#111827", glow: glow ?? "transparent", icon: icon ?? "" }
    } else if (index != null) {
        visuals = getAnswerVisuals(index)
    } else {
        visuals = { accent: "#111827", glow: "transparent", icon: "" }
    }

    const usedAccent = visuals.accent
    const usedGlow = visuals.glow
    const usedIcon = visuals.icon

    return (
        <div
            className="bg-background/95 dark:bg-muted/40 border-border group relative overflow-hidden rounded-2xl border p-3 shadow-lg backdrop-blur-sm transition-all hover:scale-[1.01] sm:p-5"
            style={{
                boxShadow: `0 0 0 rgba(0,0,0,0)`,
            }}
        >
            {/* Hover Glow */}
            <div
                className="absolute inset-0 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
                style={{
                    background: correct
                        ? "radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)"
                        : usedGlow,
                }}
            />

            <div className="relative flex flex-col gap-3">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white shadow-lg sm:h-11 sm:w-11 sm:rounded-xl sm:text-lg"
                        style={{
                            background: correct ? "#22c55e" : usedAccent,
                        }}
                    >
                        {usedIcon}
                    </div>

                    <div className="relative w-full">
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

                        {error ? (
                            <div className="absolute right-0 bottom-0 left-0 mx-2 mb-1 text-sm font-medium text-red-500">
                                This field is required
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {canDelete && onDelete ? (
                        <Button
                            aria-label="Delete answer option"
                            className="h-8 w-full gap-2 rounded-full border border-white/10 bg-black/20 px-3 text-[10px] font-bold tracking-widest text-white shadow-none hover:bg-red-500/90 hover:text-white sm:w-auto"
                            onClick={onDelete}
                            type="button"
                            variant="ghost"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    ) : null}

                    {onToggleCorrect ? (
                        <Button
                            aria-pressed={!!correct}
                            onClick={onToggleCorrect}
                            type="button"
                            variant="ghost"
                            className={`h-8 w-full gap-2 rounded-full px-3 text-[10px] font-bold tracking-widest shadow-none transition-colors sm:ml-auto sm:w-auto ${
                                correct
                                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25"
                                    : "border-red-400/40 bg-red-500/20 text-red-300 hover:bg-red-500/25"
                            }`}
                        >
                            {correct ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                <X className="h-3.5 w-3.5" />
                            )}
                            {correct ? "Correct" : "Wrong"}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
