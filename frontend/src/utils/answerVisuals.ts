const answerIcons = ["▲", "◆", "●", "■"] as const

export default function getAnswerVisuals(index: number): {
    accent: string
    glow: string
    icon: string
} {
    const hue = (index * 47) % 360
    const accent = `hsl(${hue} 82% 56%)`
    const glow = `radial-gradient(circle, hsl(${hue} 82% 56%) 0%, transparent 70%)`

    return {
        accent,
        glow,
        icon: answerIcons[index % answerIcons.length],
    }
}
