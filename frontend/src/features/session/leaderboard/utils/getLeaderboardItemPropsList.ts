import type { LeaderboardItem } from "@/features/session/leaderboard/types/leaderboardItem.ts"
import type { LeaderboardItemProps } from "@/features/session/leaderboard/views/LeaderboardItem.tsx"

/**
 * Sorts leaderboard items by points (descending) and assigns each a rank,
 * with tied point totals sharing the same rank (dense ranking, no gaps).
 */
export default function getLeaderboardItemPropsList(
    items: LeaderboardItem[]
): LeaderboardItemProps[] {
    const sorted = [...items].sort((a, b) => b.points - a.points)

    let prevPoints: number | null = null
    let rank = 0
    return sorted.map((item) => {
        if (item.points !== prevPoints) {
            prevPoints = item.points
            rank += 1
        }
        return {
            ranking: rank,
            avatar: item.avatar,
            name: item.name,
            points: item.points,
        }
    })
}
