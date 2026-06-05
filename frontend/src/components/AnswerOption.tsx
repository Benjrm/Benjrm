import type { JSX } from "react"
import getAnswerVisuals from "@/utils/answerVisuals"

interface AnswerOptionProps {
    index: number
    text: string
    isSelected: boolean
    color?: string
    icon?: string
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
    let visuals = { accent: color, icon }
    if (icon == null && color == null) {
        visuals = getAnswerVisuals(index)
    }
    return (
        <button
            aria-pressed={isSelected}
            onClick={() => onSelect(index)}
            type="button"
            className={`bg-muted/30 relative flex flex-col items-center justify-center gap-4 overflow-visible rounded-2xl border-2 p-8 text-center shadow-sm backdrop-blur-lg transition-all duration-300 ease-out ${
                isSelected
                    ? "scale-[1.01] shadow-[0_0_40px_var(--glow-color)]"
                    : "hover:scale-[1.01] hover:shadow-[0_0_40px_var(--glow-color)]"
            }`}
            style={
                {
                    borderColor: isSelected ? "var(--glow-color)" : "rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? `0 0 40px ${visuals.accent}` : undefined,
                    "--glow-color": visuals.accent,
                } as React.CSSProperties
            }
        >
            <div
                className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-black text-white shadow-md"
                style={{ background: visuals.accent }}
            >
                {visuals.icon}
            </div>

            <div className="text-base font-bold">{text || `Option ${index + 1}`}</div>
        </button>
    )
}
