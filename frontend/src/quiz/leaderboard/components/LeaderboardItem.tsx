import type { ReactNode } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn/components/ui/avatar"
import getRankingClassName from "@/quiz/leaderboard/utils/getRankingClassName.ts"
import type { LeaderboardEntry } from "@/types/quiz"

export interface LeaderboardItemProps extends Omit<LeaderboardEntry, "id"> {
    ranking: number
}

export default function LeaderboardItem({
    ranking,
    avatar,
    name,
    points,
}: LeaderboardItemProps): ReactNode {
    const rankingClassName = getRankingClassName(ranking)
    const initials = name.substring(0, 2).toUpperCase()

    return (
        <div
            className={`grid grid-cols-[20px_1fr_auto] items-center gap-6 rounded-xl border p-4 ${rankingClassName} `}
        >
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage alt={name} src={avatar} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </div>
            <div>{name}</div>
            <div className="font-semibold tabular-nums">{points} pts</div>
        </div>
    )
}
