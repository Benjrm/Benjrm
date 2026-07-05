const ICONS = ["▲", "◆", "●", "■", "◯", "◆", "◪", "◎", "⟐", "◬"]
const COLORS = ["#2d4cc9", "#ffa602", "#11c8d4", "#ff4949", "#28c28b", "#8b5cf6"]

/**
 * Derives a deterministic accent color, glow gradient, and icon for an
 * answer option based on its position, cycling through fixed palettes so
 * options keep a stable look regardless of how many there are.
 *
 * @param index - Zero-based position of the answer option.
 */
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
