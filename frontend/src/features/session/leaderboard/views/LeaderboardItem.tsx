import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@shadcn/components/ui/avatar"
import getRankingClassName from "@/features/session/leaderboard/utils/getRankingClassName"
import getRankingDisplay from "@/features/session/leaderboard/utils/getRankingDisplay"

interface LeaderboardItemProps {
    ranking: number
    avatar?: string
    name: string
    points: number
}

export default function LeaderboardItem(
    leaderboardItemProps: Readonly<LeaderboardItemProps>
): ReactNode {
    const { t } = useTranslation()
    const { ranking, avatar, name, points } = leaderboardItemProps
    const rankingClassName = getRankingClassName(ranking)
    const initials = name.substring(0, 2).toUpperCase()

    return (
        <motion.div
            layout
            animate={{ opacity: 1, y: 0 }}
            className={`grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-4 rounded-xl border p-4 ${rankingClassName}`}
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: 20 }}
            layoutId={name}
            transition={{ layout: { type: "spring", stiffness: 300, damping: 30 }, duration: 0.3 }}
        >
            <div className="text-center text-lg font-black">{getRankingDisplay(ranking)}</div>
            <Avatar>
                <AvatarFallback>{avatar ?? initials}</AvatarFallback>
            </Avatar>
            <div className="font-semibold">{name}</div>
            <div className="font-bold tabular-nums">
                {points} {t("game.leaderboard.pts")}
            </div>
        </motion.div>
    )
}
