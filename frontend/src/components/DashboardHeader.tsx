import type { JSX } from "react"

interface DashboardHeaderProps {
    roomPin: string
    playersCount: number
}

export default function DashboardHeader({
    roomPin,
    playersCount,
}: DashboardHeaderProps): JSX.Element {
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
                <div className="bg-muted/20 border-border/10 text-foreground/80 rounded-full border px-4 py-2.5 text-sm font-medium">
                    {playersCount} players
                </div>
            </div>
        </header>
    )
}
