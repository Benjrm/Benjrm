import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import GamePinBadge from "@/components/GamePinBadge"

export default function Lobby({
    children,
    codeWithDash,
}: {
    children: React.ReactNode
    codeWithDash?: string
}): JSX.Element {
    const { t } = useTranslation()

    return (
        <section className="mx-auto w-full max-w-4xl py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    {t("lobby.waitingLobby")}
                </div>
                <GamePinBadge codeWithDash={codeWithDash} />
            </div>

            <div className="dark:text-foreground overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111318]">
                <div className="bg-linear-to-r from-[#00D4E8]/10 via-transparent to-[#FF8A00]/10 p-6 sm:p-8">
                    {children}
                </div>
            </div>
        </section>
    )
}
