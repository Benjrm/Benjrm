// frontend/src/pages/WaitingRoom.tsx

import type { JSX } from "react"
import { useState } from "react"
import ProfilePicker from "../components/ProfilePicker"
import { Button } from "@/shadcn/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"

interface Player {
    id: string
    name: string
    emoji?: string
}

const AVAILABLE_EMOJIS = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😉",
    "😍",
    "🤩",
    "😎",
    "🦁",
    "🦒",
    "🐭",
    "🐶",
    "🐱",
    "🐼",
    "🐸",
    "🦎",
    "🦕",
    "🦖",
    "🦄",
    "🐴",
    "🐳",
    "🐵",
    "🦊",
    "🦉",
    "🌟",
]

export default function WaitingRoom(): JSX.Element {
    // MOCK
    const isHost = true
    const [players, setPlayers] = useState<Player[]>([
        { id: "1", name: "Funny Crocodile (you)", emoji: "🦎" },
        { id: "2", name: "Smart Giraffe", emoji: "🦒" },
        { id: "3", name: "Big Mouse", emoji: "🐭" },
        { id: "4", name: "Small Horse", emoji: "🐴" },
        { id: "5", name: "Funny Crocodile 1", emoji: "🦎" },
    ])
    const [name, setName] = useState<string>(players[0].name)
    const [emoji, setEmoji] = useState<string | undefined>(players[0].emoji)
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)

    function onPickEmoji(nextEmoji: string): void {
        setEmoji(nextEmoji)
        setPlayers((previous) => {
            const copy = [...previous]
            if (copy.length > 0) {
                copy[0] = { ...copy[0], emoji: nextEmoji }
            }
            return copy
        })
        setIsEmojiOpen(false)
    }

    return (
        <section className="mx-auto w-full max-w-4xl py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    Waiting Lobby
                </div>
                <p className="text-muted-foreground text-sm">Game Pin: 134 567</p>
            </div>

            <div className="dark:text-foreground overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111318]">
                <div className="bg-linear-to-r from-[#00D4E8]/10 via-transparent to-[#FF8A00]/10 p-6 sm:p-8">
                    <div className="mb-5 rounded-xl border border-white/10 bg-black/10 p-4 dark:bg-black/20">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-semibold tracking-wide">Player Setup</p>
                            <span className="text-muted-foreground text-xs">
                                Tap avatar to choose emoji
                            </span>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <ProfilePicker
                                emoji={emoji}
                                name={name}
                                onNameChange={setName}
                                onOpenEmoji={() => setIsEmojiOpen(true)}
                            />
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                                <Button
                                    className="border-white/20 bg-[#242424] text-white hover:bg-[#2f2f2f]"
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        // Name generation is implemented in a separate PR.
                                    }}
                                >
                                    Generate Name
                                </Button>
                                <Button
                                    className="border-0 bg-[#00D4E8] font-semibold text-black shadow-[0_0_20px_-6px_rgba(0,212,232,0.75)] hover:bg-[#00BDD0]"
                                    type="button"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                            Firefighting Training Quiz
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Players joined:{" "}
                            <span className="text-foreground font-semibold">{players.length}</span>
                        </p>
                    </div>

                    <ul className="space-y-2">
                        {players.map((player) => (
                            <li
                                key={player.id}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 dark:bg-black/20"
                            >
                                <div className="bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full text-base">
                                    {player.emoji ?? "🙂"}
                                </div>
                                <p className="text-sm font-medium">{player.name}</p>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex items-center justify-center border-t border-white/10 pt-6">
                        {isHost ? (
                            <Button
                                className="rounded-xl border-0 bg-[#00D4E8] px-8 py-5 text-sm font-bold tracking-wide text-black uppercase shadow-[0_0_20px_-5px_rgba(0,212,232,0.6)] transition-all hover:bg-[#00BDD0]"
                                size="lg"
                                type="button"
                            >
                                Start Game
                            </Button>
                        ) : (
                            <p className="text-muted-foreground text-sm font-medium">
                                Waiting for host to start the game
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Dialog onOpenChange={setIsEmojiOpen} open={isEmojiOpen}>
                <DialogContent className="border-white/10 bg-[#111318] text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Choose profile emoji</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                        {AVAILABLE_EMOJIS.map((em) => (
                            <button
                                key={em}
                                className="hover:bg-muted/70 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-black/20 text-xl transition"
                                onClick={() => onPickEmoji(em)}
                                type="button"
                            >
                                {em}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    )
}
