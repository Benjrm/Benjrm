import type { ReactNode } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn/components/ui/avatar.tsx"
import getRankingClassName from "@/quiz/leaderboard/utils/getRankingClassName.ts"

export interface LeaderboardItemProps {
    ranking: number
    avatar?: string | undefined
    name: string
    points: number
}

export default function LeaderboardItem(leaderboardItemProps: LeaderboardItemProps): ReactNode {
    const { ranking, avatar, name, points } = leaderboardItemProps
    const rankingClassName = getRankingClassName(ranking)

    return (
        <div
            className={`grid grid-cols-[20px_1fr_auto] items-center gap-4 rounded-xl border p-4 ${rankingClassName} `}
        >
            <div>#{ranking}</div>
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage alt={name} src={avatar} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span className="font-medium">{name}</span>
            </div>
            <div className="font-semibold tabular-nums">{points} pts</div>
        </div>
    )
}
