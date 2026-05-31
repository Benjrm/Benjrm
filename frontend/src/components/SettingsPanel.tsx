// frontend/src/components/SettingsPanel.tsx

import type { JSX } from "react"
import AnswerPreviewGrid from "./AnswerPreviewGrid"
import { Label } from "@/shadcn/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shadcn/components/ui/select"
import { ScrollArea } from "@/shadcn/components/ui/scroll-area"
import type { Question } from "@/types/quiz"

interface SettingsPanelProps {
    question: Question
}

export default function SettingsPanel({ question }: SettingsPanelProps): JSX.Element {
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
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2FF]/20 bg-[#00F2FF]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#00F2FF] uppercase dark:border-[#00F2FF]/20 dark:bg-[#00F2FF]/10 dark:text-[#00F2FF]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00F2FF]" />
                    Live Preview
                </div>

                {/* Phone Mockup */}
                <div className="bg-background/80 border-border dark:bg-muted/25 relative overflow-hidden rounded-[2rem] border p-4 shadow-2xl backdrop-blur-sm">
                    {/* Glow */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#00F2FF]/10 blur-3xl" />
                    <div className="absolute -bottom-14 -left-8 h-28 w-28 rounded-full bg-[#FF8A00]/10 blur-3xl" />

                    <div className="relative flex aspect-[9/16] flex-col overflow-hidden rounded-[1.5rem] border border-black/5 bg-[#f8fafc] p-3 shadow-inner dark:border-white/5 dark:bg-black/25">
                        <div className="mb-3 flex items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#00F2FF] shadow-[0_0_0_4px_rgba(0,242,255,0.12)]" />
                                <span className="text-[10px] font-bold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-300">
                                    Quiz Preview
                                </span>
                            </div>

                            <span className="rounded-full border border-black/5 bg-slate-100 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-slate-500 uppercase dark:border-white/5 dark:bg-white/5 dark:text-slate-300">
                                {question.type === "SINGLE_CHOICE" ? "Single" : "Multiple"}
                            </span>
                        </div>

                        {/* Question */}
                        <div className="border-border mb-3 rounded-[1.25rem] border bg-white/90 p-4 text-center shadow-sm dark:bg-white/10">
                            <div className="text-[10px] font-bold tracking-[0.2em] text-[#FF8A00] uppercase">
                                Question
                            </div>
                            <div className="mt-2 text-sm leading-5 font-extrabold text-slate-900 dark:text-white">
                                {question.question?.trim() || "Type your question..."}
                            </div>
                        </div>

                        {/* Answers */}
                        <ScrollArea className="min-h-0 flex-1 pr-1">
                            <AnswerPreviewGrid options={question.options} />
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </aside>
    )
}
