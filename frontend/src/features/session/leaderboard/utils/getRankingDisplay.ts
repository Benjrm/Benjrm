/** Renders a leaderboard rank as a medal emoji for the top 3, or `#N` otherwise. */
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
