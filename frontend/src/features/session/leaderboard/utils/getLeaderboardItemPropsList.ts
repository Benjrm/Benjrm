import type { LeaderboardItem } from "@/features/session/leaderboard/api/leaderboardItem.ts"
import type { LeaderboardItemProps } from "@/features/session/leaderboard/components/LeaderboardItem.tsx"

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
