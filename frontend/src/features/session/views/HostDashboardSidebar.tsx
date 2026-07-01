import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shadcn/components/ui/button"
import LeaderboardItem from "@/features/session/leaderboard/components/LeaderboardItem"
import getLeaderboardItemPropsList from "@/features/session/leaderboard/utils/getLeaderboardItemPropsList"
import type { LeaderboardItem as LeaderboardItemType } from "@/features/session/leaderboard/types/leaderboardItem.ts"

interface HostDashboardSidebarProps {
    entries: LeaderboardItemType[]
    onNext: () => void
    isFinal?: boolean
    isLastQuestion?: boolean
    onEnd?: () => void
    onShowPodium?: () => void
}

export default function HostDashboardSidebar({
    entries,
    onNext,
    isFinal = false,
    isLastQuestion = false,
    onEnd,
    onShowPodium,
}: HostDashboardSidebarProps): JSX.Element {
    const { t } = useTranslation()
    const leaderboardItems = getLeaderboardItemPropsList(entries)

    function renderActionButton(): JSX.Element {
        if (onShowPodium) {
            return (
                <Button
                    className="w-full cursor-pointer rounded-2xl border-0 bg-linear-to-br from-[#FFD700] to-[#FFA500] px-6 py-6 text-lg font-black text-black shadow-[0_8px_30px_-8px_rgba(255,215,0,0.6)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] active:scale-100"
                    onClick={onShowPodium}
                    type="button"
                >
                    {t("game.host.showPodium")}
                </Button>
            )
        }
        if (isFinal && onEnd) {
            return (
                <Button
                    className="w-full cursor-pointer rounded-2xl border-0 bg-red-500 px-6 py-6 text-lg font-black text-white transition-all duration-200 hover:scale-[1.01] hover:bg-red-600 active:scale-100"
                    onClick={onEnd}
                    type="button"
                >
                    {t("game.host.endGame")}
                </Button>
            )
        }
        return (
            <Button
                className="w-full cursor-pointer rounded-2xl border-0 bg-linear-to-br from-[#00D4E8] to-[#00AFC0] px-6 py-6 text-lg font-black text-black shadow-[0_8px_30px_-8px_rgba(0,212,232,0.6)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(0,212,232,0.4)] active:scale-100"
                onClick={onNext}
                type="button"
            >
                {isLastQuestion ? t("game.host.showLeaderboard") : t("game.host.nextQuestion")}
            </Button>
        )
    }

    return (
        <aside className="flex flex-col gap-6">
            <div className="bg-muted/30 border-border flex-1 rounded-3xl border p-5 shadow-xl backdrop-blur-sm">
                <h4 className="mb-4 text-lg font-black tracking-tight">
                    {t("game.leaderboard.title")}
                </h4>
                {leaderboardItems.length > 0 ? (
                    <ol className="max-h-[45vh] space-y-3 overflow-auto pr-1">
                        {leaderboardItems.map((item) => (
                            <li key={`${item.ranking}-${item.name}`}>
                                <LeaderboardItem {...item} />
                            </li>
                        ))}
                    </ol>
                ) : null}
            </div>

            <div className="mt-auto">{renderActionButton()}</div>
        </aside>
    )
}
