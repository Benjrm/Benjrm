// frontend/src/components/GameHeroSection.tsx
import type { JSX } from "react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { PlusSquare } from "lucide-react"
import { Input } from "@/shadcn/components/ui/input"
import { Button } from "@/shadcn/components/ui/button"

interface GameHeroSectionProps {
    onAddQuizClick: () => void
}

export default function GameHeroSection({ onAddQuizClick }: GameHeroSectionProps): JSX.Element {
    const [digits, setDigits] = useState("")
    const navigate = useNavigate()

    const displayCode = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits

    function onJoinClick(): void {
        if (!digits) return
        navigate(`/play/${encodeURIComponent(digits)}`)
    }

    return (
        <section className="w-full">
            {/* Container */}
            <div className="dark:text-foreground flex min-h-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl lg:flex-row dark:border-white/10 dark:bg-[#111318]">
                {/* Left Side: Controls */}
                <div className="z-10 flex flex-1 flex-col justify-center gap-8 p-8 lg:p-10">
                    {/* Code Input */}
                    <div className="max-w-xs space-y-2">
                        <Input
                            aria-label="Input Code"
                            className="dark:text-foreground dark:placeholder:text-muted-foreground rounded-xl border-slate-200 bg-slate-50 px-4 py-5 text-base font-medium text-slate-900 transition-all placeholder:text-slate-500 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#00F2FF] dark:border-white/10 dark:bg-[#1C2028]"
                            inputMode="numeric"
                            onKeyDown={(e) => e.key === "Enter" && onJoinClick()}
                            placeholder="Code"
                            type="text"
                            value={displayCode}
                            onChange={(e) =>
                                setDigits(e.target.value.replace(/\D/g, "").slice(0, 8))
                            }
                        />
                        <p className="dark:text-muted-foreground pl-1 text-sm text-slate-500">
                            Join via Code
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            className="flex items-center gap-2 rounded-xl border-0 bg-[#00D4E8] px-6 py-5 text-sm font-bold tracking-wide text-black uppercase shadow-[0_0_20px_-5px_rgba(0,212,232,0.5)] transition-all hover:bg-[#00BDD0]"
                            onClick={() => onJoinClick()}
                            type="button"
                        >
                            START GAME
                            <svg fill="currentColor" height="10" viewBox="0 0 24 24" width="10">
                                <path d="M5 3L19 12L5 21V3Z" />
                            </svg>
                        </Button>

                        <Button
                            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#242424] px-5 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition-colors hover:bg-[#2f2f2f] dark:border-white/10 dark:bg-[#242424] dark:hover:bg-[#2f2f2f]"
                            onClick={onAddQuizClick}
                            type="button"
                        >
                            <span>Add Quiz</span>
                            <PlusSquare className="h-4 w-4 shrink-0 text-white/85" />
                        </Button>
                    </div>
                </div>

                {/* Right Side: Image */}
                <div className="relative min-h-56 flex-1 lg:min-h-0">
                    <img
                        alt="People celebrating"
                        className="absolute inset-0 h-full w-full object-cover"
                        src="/pictures/happy_people.jpg"
                    />
                    <div className="absolute inset-0 w-full bg-linear-to-r from-white via-white/70 to-transparent md:w-1/3 dark:from-[#111318] dark:via-[#111318]/40" />
                </div>
            </div>
        </section>
    )
}
