// frontend/src/components/AnswerCard.tsx

import type { JSX } from "react"
import { Input } from "@/shadcn/components/ui/input"

export interface AnswerCardProps {
    icon: string
    placeholder: string
    value: string
    onChange: (val: string) => void
    accent: string
    glow: string
}

export default function AnswerCard({
    icon,
    placeholder,
    value,
    onChange,
    accent,
    glow,
}: AnswerCardProps): JSX.Element {
    return (
        <div
            className="bg-muted/40 border-border group relative overflow-hidden rounded-2xl border p-5 shadow-lg backdrop-blur-sm transition-all hover:scale-[1.01]"
            style={{
                boxShadow: `0 0 0 rgba(0,0,0,0)`,
            }}
        >
            {/* Hover Glow */}
            <div
                className="absolute inset-0 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
                style={{
                    background: glow,
                }}
            />

            <div className="relative flex items-center gap-4">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white shadow-lg"
                    style={{
                        background: accent,
                    }}
                >
                    {icon}
                </div>

                <Input
                    className="placeholder:text-muted-foreground/60 h-auto border-none bg-transparent p-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    type="text"
                    value={value}
                />
            </div>
        </div>
    )
}
