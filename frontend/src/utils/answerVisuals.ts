export const ICONS = ["▲", "◆", "●", "■", "◯", "◆", "◪", "◎", "⟐", "◬"]
export const COLORS = ["#2d4cc9", "#ffa602", "#11c8d4", "#ff4949", "#28c28b", "#8b5cf6"]

export default function getAnswerVisuals(index: number): {
    accent: string
    glow: string
    icon: string
} {
    const accent = COLORS[index % COLORS.length]
    const glow = `radial-gradient(circle, ${accent} 0%, transparent 70%)`
    const icon = ICONS[index % ICONS.length]

    return {
        accent,
        glow,
        icon,
    }
}
