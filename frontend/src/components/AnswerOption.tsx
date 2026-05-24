import type { JSX } from "react"

interface AnswerOptionProps {
    index: number
    text: string
    isSelected: boolean
    color: string
    icon: string
    onSelect: (index: number) => void
}

export default function AnswerOption({
    index,
    text,
    isSelected,
    color,
    icon,
    onSelect,
}: AnswerOptionProps): JSX.Element {
    return (
        <button
            aria-pressed={isSelected}
            onClick={() => onSelect(index)}
            style={{ "--glow-color": color } as React.CSSProperties}
            type="button"
            className={`border-border/40 bg-muted/30 relative flex flex-col items-center justify-center gap-4 overflow-visible rounded-2xl border p-8 text-center shadow-sm backdrop-blur-lg transition-all duration-300 ease-out ${
                isSelected
                    ? "scale-[1.01] shadow-[0_0_60px_var(--glow-color)] ring-2 ring-offset-2"
                    : "hover:scale-[1.01] hover:shadow-[0_0_60px_var(--glow-color)]"
            }`}
        >
            <div
                className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-black text-white shadow-md"
                style={{ background: color }}
            >
                {icon}
            </div>

            <div className="text-base font-bold">{text || `Option ${index + 1}`}</div>
        </button>
    )
}
