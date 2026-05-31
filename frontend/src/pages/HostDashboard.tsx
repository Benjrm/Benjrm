// frontend/src/pages/HostDashboard.tsx

import type { JSX } from "react"
import { toast } from "sonner"
import { Button } from "@/shadcn/components/ui/button"

interface LeaderboardEntry {
    id: string
    name: string
    points: number
}

function DashboardHeader({ roomPin, playersCount }: { roomPin: string; playersCount: number }) {
    return (
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                    Host Dashboard
                </h1>
                <p className="flex items-center gap-2 text-sm font-black tracking-widest text-[#FF8A00] uppercase">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF8A00]" />
                    Firefighting Quiz
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-muted/30 border-border/40 rounded-full border px-6 py-2.5 text-base font-bold backdrop-blur-sm">
                    Room Pin: <span className="text-[#00F2FF]">{roomPin}</span>
                </div>
                <div className="bg-muted/20 border-border/10 rounded-full border px-4 py-2.5 text-sm font-medium text-white/80">
                    {playersCount} players
                </div>
            </div>
        </header>
    )
}

function QuestionPanel({
    question,
    answered,
    total,
}: {
    question: string
    answered: number
    total: number
}) {
    return (
        <div className="bg-muted/20 border-border/10 relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-[#FF8A00]/8 blur-3xl" />

            <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    Current Question
                </h3>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-bold tracking-tight text-[#FF8A00] shadow-[0_0_15px_rgba(255,138,0,0.2)]">
                    3 Secs left
                </div>
            </div>

            <div className="my-10">
                <p className="max-w-3xl text-3xl leading-tight font-black tracking-tight wrap-break-word sm:text-4xl">
                    {question}
                </p>
            </div>

            {/* Progress Bar Section */}
            <div className="mt-6 border-t border-white/5 pt-6">
                <div className="text-muted-foreground flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="h-5 w-5 animate-spin text-[#00F2FF]" viewBox="0 0 24 24">
                            <circle
                                cx="12"
                                cy="12"
                                fill="none"
                                r="10"
                                stroke="currentColor"
                                strokeDasharray="45"
                                strokeDashoffset="0"
                                strokeWidth="3.5"
                            />
                        </svg>
                        <span className="text-base font-medium text-white/90">
                            Waiting for answers...
                        </span>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-2xl font-black tracking-tight">
                            {answered} / {total}
                        </span>
                        <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-white/5 sm:block">
                            <div
                                className="h-full bg-[#00F2FF] shadow-[0_0_10px_rgba(0,242,255,0.5)] transition-all duration-300"
                                style={{ width: `${(answered / total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SidebarLeaderboard({
    entries,
    onNext,
}: {
    entries: LeaderboardEntry[]
    onNext: () => void
}) {
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

export default function HostDashboard(): JSX.Element {
    // UI-only mock data
    const roomPin = "123 456"
    const playersCount = 24
    const answered = 13
    const total = playersCount
    const currentQuestion = "Why did the chicken cross the road?"

    const leaderboard: LeaderboardEntry[] = [
        { id: "1", name: "Funny Crocodile", points: 2395 },
        { id: "2", name: "Tall Goose", points: 2192 },
        { id: "3", name: "Doctor Mouse", points: 1877 },
    ]

    const handleNextQuestion = () => {
        toast("Advancing quiz...")
    }

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden px-4 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <DashboardHeader playersCount={playersCount} roomPin={roomPin} />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                    <QuestionPanel answered={answered} question={currentQuestion} total={total} />

                    <SidebarLeaderboard entries={leaderboard} onNext={handleNextQuestion} />
                </div>
            </div>
        </div>
    )
}
