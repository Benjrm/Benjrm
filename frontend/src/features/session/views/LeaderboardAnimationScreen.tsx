import type { JSX } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Button } from "@/shadcn/components/ui/button"
import { Avatar, AvatarFallback } from "@shadcn/components/ui/avatar"
import getRankingDisplay from "@/features/session/leaderboard/utils/getRankingDisplay"
import getRankingClassName from "@/features/session/leaderboard/utils/getRankingClassName"
import type { LeaderboardEntry } from "@/features/session/types/session.ts"

interface LeaderboardAnimationScreenProps {
    leaderboard: LeaderboardEntry[]
    isFinal: boolean
    onLeave: () => void
}

export default function LeaderboardAnimationScreen({
    leaderboard,
    isFinal,
    onLeave,
}: Readonly<LeaderboardAnimationScreenProps>): JSX.Element {
    const { t } = useTranslation()

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
            <motion.h1
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-extrabold tracking-tight uppercase sm:text-5xl"
                initial={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
            >
                {isFinal ? t("game.leaderboard.finalPodium") : t("game.leaderboard.title")}
            </motion.h1>

            <div className="w-full max-w-lg">
                <AnimatePresence>
                    {leaderboard.map((entry, i) => {
                        const rank = i + 1
                        const initials = entry.name.substring(0, 2).toUpperCase()

                        return (
                            <motion.div
                                key={entry.id}
                                animate={{ opacity: 1, x: 0 }}
                                className={`mb-3 grid grid-cols-[2.5rem_3rem_1fr_auto] items-center gap-3 rounded-2xl border p-4 text-base font-semibold shadow-sm ${getRankingClassName(rank)}`}
                                initial={{ opacity: 0, x: -60 }}
                                transition={{
                                    opacity: { delay: i * 0.08, duration: 0.35 },
                                    x: { delay: i * 0.08, duration: 0.35 },
                                }}
                            >
                                <div className="text-center text-xl">
                                    <span className="text-muted-foreground text-sm font-bold">
                                        {getRankingDisplay(rank)}
                                    </span>
                                </div>
                                <Avatar>
                                    <AvatarFallback>{entry.emoji ?? initials}</AvatarFallback>
                                </Avatar>
                                <span className="truncate font-bold">{entry.name}</span>
                                <span className="font-bold tabular-nums">
                                    {entry.totalPoints} {t("game.leaderboard.pts")}
                                </span>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {isFinal ? (
                <motion.div
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <p className="text-xl font-bold text-yellow-500">
                        {t("game.leaderboard.finished")}
                    </p>
                    <Button
                        className="bg-red-500 px-8 py-6 text-lg font-bold text-white hover:bg-red-600"
                        onClick={onLeave}
                    >
                        {t("game.leaderboard.leave")}
                    </Button>
                </motion.div>
            ) : null}
        </div>
    )
}
