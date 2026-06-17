import type { ReactNode } from "react"
import LeaderboardItem from "@/quiz/leaderboard/components/LeaderboardItem"
import getLeaderboardItemPropsList from "@/quiz/leaderboard/utils/getLeaderboardItemPropsList"
import type { LeaderboardItem as LeaderboardItemType } from "@/quiz/leaderboard/api/leaderboardItem"

interface LeaderboardProps {
    entries: LeaderboardItemType[]
}

export default function Leaderboard({ entries }: LeaderboardProps): ReactNode {
    const items = getLeaderboardItemPropsList(entries)
    if (items.length === 0) return null
    return (
        <ol className="space-y-3">
            {items.map((item) => (
                <li key={`${item.ranking}-${item.name}`}>
                    <LeaderboardItem {...item} />
                </li>
            ))}
        </ol>
    )
}
