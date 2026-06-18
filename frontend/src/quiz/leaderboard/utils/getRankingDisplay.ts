export default function getRankingDisplay(ranking: number): string {
    switch (ranking) {
        case 1:
            return "🥇"
        case 2:
            return "🥈"
        case 3:
            return "🥉"
        default:
            return `#${ranking}`
    }
}
