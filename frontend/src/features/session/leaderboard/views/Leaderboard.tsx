import type { ReactNode } from "react"
import { AnimatePresence } from "framer-motion"
import getLeaderboardItemPropsList from "@/features/session/leaderboard/utils/getLeaderboardItemPropsList.ts"
import LeaderboardItem from "@/features/session/leaderboard/views/LeaderboardItem.tsx"
import type { LeaderboardItem as LeaderboardItemType } from "@/features/session/leaderboard/types/leaderboardItem.ts"

interface LeaderboardProps {
    items: LeaderboardItemType[]
    title?: string
}

export default function Leaderboard({
    items,
    title = "Leaderboard",
}: Readonly<LeaderboardProps>): ReactNode {
    const leaderboardItemPropsList = getLeaderboardItemPropsList(items)
    if (leaderboardItemPropsList.length === 0) return null
    return (
        <div className="bg-card text-card-foreground border-border mx-auto flex w-full max-w-xl flex-col gap-4 rounded-xl border p-6 shadow-sm">
            <h1 className="text-center text-3xl font-extrabold uppercase sm:text-4xl lg:text-5xl">
                {title}
            </h1>
            <div className="flex flex-col gap-4 rounded-xl p-4">
                <AnimatePresence>
                    {leaderboardItemPropsList.map((props) => (
                        <LeaderboardItem key={props.name} {...props} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
