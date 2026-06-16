import type { JSX } from "react"
import { Button } from "@/shadcn/components/ui/button"
import LeaderboardItem from "@/quiz/leaderboard/components/LeaderboardItem"
import getLeaderboardItemPropsList from "@/quiz/leaderboard/utils/getLeaderboardItemPropsList"
import type { LeaderboardItem as LeaderboardItemType } from "@/quiz/leaderboard/api/leaderboardItem"

interface HostDashboardSidebarProps {
    entries: LeaderboardItemType[]
    onNext: () => void
}

export default function HostDashboardSidebar({
    entries,
    onNext,
}: HostDashboardSidebarProps): JSX.Element {
    const leaderboardItems = getLeaderboardItemPropsList(entries)

    return (
        <aside className="flex flex-col gap-6">
            <div className="bg-muted/30 border-border flex-1 rounded-3xl border p-5 shadow-xl backdrop-blur-sm">
                <h4 className="mb-4 text-lg font-black tracking-tight">Leaderboard</h4>
                <ol className="max-h-[45vh] space-y-3 overflow-auto pr-1">
                    {leaderboardItems.map((item) => (
                        <LeaderboardItem key={`${item.ranking}-${item.name}`} {...item} />
                    ))}
                </ol>
            </div>

            <div className="mt-auto">
                <Button
                    className="w-full cursor-pointer rounded-2xl border-0 bg-linear-to-br from-[#00D4E8] to-[#00AFC0] px-6 py-6 text-lg font-black text-black shadow-[0_8px_30px_-8px_rgba(0,212,232,0.6)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(0,212,232,0.4)] active:scale-100"
                    onClick={onNext}
                    type="button"
                >
                    Next Question →
                </Button>
            </div>
        </aside>
    )
}
