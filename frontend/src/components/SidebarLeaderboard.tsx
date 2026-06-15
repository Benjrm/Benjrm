import type { JSX } from "react"
import { Button } from "@/shadcn/components/ui/button"
import type { LeaderboardEntry } from "@/types/quiz"

interface SidebarLeaderboardProps {
    entries: LeaderboardEntry[]
    onNext: () => void
}

export default function SidebarLeaderboard({
    entries,
    onNext,
}: SidebarLeaderboardProps): JSX.Element {
    return (
        <aside className="flex flex-col gap-6">
            <div className="bg-muted/30 border-border flex-1 rounded-3xl border p-5 shadow-xl backdrop-blur-sm">
                <h4 className="mb-4 text-lg font-black tracking-tight">Leaderboard</h4>
                <ol className="max-h-[45vh] space-y-3 overflow-auto pr-1">
                    {entries.map((entry, idx) => (
                        <li
                            key={entry.id}
                            className="bg-muted/10 flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3 shadow-sm"
                        >
                            <div className="flex items-center gap-2 text-base font-bold">
                                <span className="text-muted-foreground/60 w-4 text-sm font-black">
                                    {idx + 1}
                                </span>
                                <span className="tracking-tight">{entry.name}</span>
                            </div>
                            <div className="text-sm font-black text-[#00F2FF]">
                                {entry.points}{" "}
                                <span className="text-muted-foreground text-xs font-medium">
                                    pts
                                </span>
                            </div>
                        </li>
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
