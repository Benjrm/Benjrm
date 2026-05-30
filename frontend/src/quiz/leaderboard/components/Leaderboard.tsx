import type { ReactNode } from "react"
import getLeaderboardItemPropsList from "@/quiz/leaderboard/utils/getLeaderboardItemPropsList.ts"
import LeaderboardItem from "@/quiz/leaderboard/components/LeaderboardItem.tsx"
import mockLeaderboardItems from "@/quiz/leaderboard/api/mock.ts"

export default function Leaderboard(): ReactNode {
    const leaderboardItemPropsList = getLeaderboardItemPropsList(mockLeaderboardItems)
    return (
        <div className="bg-muted/30 mx-auto flex w-full max-w-xl flex-col gap-4 rounded-xl p-6">
            <h1 className="text-center text-3xl font-extrabold uppercase sm:text-4xl lg:text-5xl">
                Leaderboard
            </h1>
            <div className="flex flex-col gap-4 rounded-xl p-4">
                {leaderboardItemPropsList.map((props) => (
                    <LeaderboardItem key={props.ranking + props.name} {...props} />
                ))}
            </div>
        </div>
    )
}
