// frontend/src/components/SettingsPanel.tsx

import type { JSX } from "react"
import type { Question } from "../types/quiz"
import { Label } from "@/shadcn/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shadcn/components/ui/select"

interface SettingsPanelProps {
    question: Question
}

export default function SettingsPanel({ question }: SettingsPanelProps): JSX.Element {
    const accents = ["#2d4cc9", "#ffa602", "#11c8d4", "#ff4949"]
    const icons = ["▲", "◆", "●", "■"]

    return (
        <aside className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#FF8A00] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                    Settings
                </div>

                {/* Controls */}
                <div className="space-y-5">
                    {/* Time Limit */}
                    <div className="space-y-2">
                        <Label
                            className="text-muted-foreground block text-[10px] font-bold tracking-widest uppercase"
                            htmlFor="timeLimit"
                        >
                            Question Time Limit
                        </Label>

                        <Select defaultValue="10 seconds">
                            <SelectTrigger
                                className="bg-background/70 border-border w-full rounded-xl backdrop-blur-sm transition-all focus:ring-2 focus:ring-[#00F2FF]/30"
                                id="timeLimit"
                            >
                                <SelectValue placeholder="Select time limit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10 seconds">10 seconds</SelectItem>
                                <SelectItem value="20 seconds">20 seconds</SelectItem>
                                <SelectItem value="30 seconds">30 seconds</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Points */}
                    <div className="space-y-2">
                        <Label
                            className="text-muted-foreground block text-[10px] font-bold tracking-widest uppercase"
                            htmlFor="points"
                        >
                            Points
                        </Label>

                        <Select defaultValue="1000">
                            <SelectTrigger
                                className="bg-background/70 border-border w-full rounded-xl backdrop-blur-sm transition-all focus:ring-2 focus:ring-[#00F2FF]/30"
                                id="points"
                            >
                                <SelectValue placeholder="Select points" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1000">1000</SelectItem>
                                <SelectItem value="2000">2000</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2FF]/20 bg-[#00F2FF]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#00F2FF] uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00F2FF]" />
                    Preview
                </div>

                {/* Phone Mockup */}
                <div className="bg-muted/30 border-border relative overflow-hidden rounded-[2rem] border p-4 shadow-2xl backdrop-blur-sm">
                    {/* Glow */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#00F2FF]/10 blur-3xl" />

                    <div className="relative flex aspect-9/16 flex-col rounded-[1.5rem] border border-white/5 bg-black/20 p-3 shadow-inner">
                        {/* Question */}
                        <div className="bg-background/60 border-border mb-3 flex min-h-14 items-center justify-center rounded-2xl border p-3 text-center text-xs font-bold backdrop-blur-sm">
                            {question.title ?? "Type your question..."}
                        </div>

                        {/* Answers */}
                        <div className="grid flex-1 grid-cols-2 gap-2">
                            {question.options.map((option, index) => (
                                <div
                                    key={`option-${icons[index]}`}
                                    className="bg-muted/40 border-border group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-2 text-center shadow-lg transition-transform hover:scale-[1.02]"
                                >
                                    {/* Background Glow */}
                                    <div
                                        className="absolute inset-0 opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40"
                                        style={{
                                            background: `radial-gradient(circle, ${accents[index]} 0%, transparent 70%)`,
                                        }}
                                    />

                                    <span
                                        className="relative z-10 mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white shadow-lg"
                                        style={{
                                            background: accents[index],
                                        }}
                                    >
                                        {icons[index]}
                                    </span>

                                    <span className="relative z-10 line-clamp-2 text-[9px] font-semibold text-white">
                                        {option || "Answer"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
