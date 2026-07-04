import type { JSX } from "react"
import { X } from "lucide-react"
import { Toaster } from "sonner"
import { useTranslation } from "react-i18next"
import Lobby from "./Lobby"
import QRCode from "@/features/session/views/QRCode"
import StartQuizButton from "@/features/quiz/views/StartQuizButton"
import { Button } from "@/shadcn/components/ui/button"

import type { SessionPlayer } from "@/features/session/types/session.ts"

interface HostLobbyProps {
    codeWithDash?: string
    quiz: { title: string } | undefined
    players: SessionPlayer[]
    onKickPlayer: (id: string) => void
    onStartGame: () => void
    startPending: boolean
}

export default function HostLobby({
    codeWithDash,
    quiz,
    players,
    onKickPlayer,
    onStartGame,
    startPending,
}: Readonly<HostLobbyProps>): JSX.Element {
    const { t } = useTranslation()
    return (
        <>
            <Lobby codeWithDash={codeWithDash}>
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                            {quiz?.title ?? t("lobby.host.noTitle")}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {t("lobby.host.playersJoined")}{" "}
                            <span className="text-foreground font-semibold">{players.length}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <QRCode codeWithDash={codeWithDash} />

                    {/* Player list — second on mobile, left on desktop */}
                    <ul className="order-2 flex-1 space-y-2 md:order-1">
                        {players.map((player) => (
                            <li
                                key={player.id}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 dark:bg-black/20"
                            >
                                <div className="bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase">
                                    {player.emoji ?? player.name.charAt(0)}
                                </div>
                                <p className="flex-1 text-sm font-medium">{player.name}</p>
                                <Button
                                    className="h-7 w-7 text-white/50 hover:text-red-400"
                                    onClick={() => onKickPlayer(player.id)}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                    title={t("lobby.host.kickPlayer", {
                                        name: player.name,
                                    })}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                        {players.length === 0 ? (
                            <li className="text-muted-foreground py-4 text-center text-sm">
                                {t("lobby.host.noPlayers")}
                            </li>
                        ) : null}
                    </ul>
                </div>

                <div className="mt-8 flex items-center justify-center border-t border-white/10 pt-6">
                    <StartQuizButton disabled={startPending} onStartQuiz={onStartGame} />
                </div>
            </Lobby>

            <Toaster richColors />
        </>
    )
}
