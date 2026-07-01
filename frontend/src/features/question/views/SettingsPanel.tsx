// frontend/src/components/SettingsPanel.tsx

import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import AnswerPreviewGrid from "./AnswerPreviewGrid"
import { ScrollArea } from "@/shadcn/components/ui/scroll-area"
import MarkdownComponent from "@/shared/views/markdown/MarkdownComponent"
import type { Question } from "@/features/question/types/questions.types.ts"

interface SettingsPanelProps {
    question: Question
}

export default function SettingsPanel({ question }: SettingsPanelProps): JSX.Element {
    const { t } = useTranslation()

    return (
        <aside className="flex flex-col gap-8">
            {/* Preview */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2FF]/20 bg-[#00F2FF]/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#00F2FF] uppercase dark:border-[#00F2FF]/20 dark:bg-[#00F2FF]/10 dark:text-[#00F2FF]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00F2FF]" />
                    {t("quizEditor.settings.livePreview")}
                </div>

                {/* Phone Mockup */}
                <div className="bg-background/80 border-border dark:bg-muted/25 relative overflow-hidden rounded-[2rem] border p-4 shadow-2xl backdrop-blur-sm">
                    {/* Glow */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#00F2FF]/10 blur-3xl" />
                    <div className="absolute -bottom-14 -left-8 h-28 w-28 rounded-full bg-[#FF8A00]/10 blur-3xl" />

                    <div className="relative flex aspect-[9/16] flex-col overflow-hidden rounded-[1.5rem] border border-black/5 bg-[#f8fafc] p-3 shadow-inner dark:border-white/5 dark:bg-black/25">
                        {/* Question */}
                        <div className="border-border mb-3 rounded-[1.25rem] border bg-white/90 p-3 text-center shadow-sm dark:bg-white/10">
                            <div className="text-[10px] font-bold tracking-[0.2em] text-[#FF8A00] uppercase">
                                {question.type === "SLIDE"
                                    ? t("quizEditor.settings.slideContent")
                                    : t("quizEditor.editor.question")}
                            </div>
                            {question.type === "SLIDE" ? (
                                <div className="mt-2 text-left text-xs leading-5 text-slate-900 dark:text-white">
                                    <MarkdownComponent
                                        content={
                                            question.question?.trim() ||
                                            t("quizEditor.settings.typeMarkdownHere")
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="[&_p]:text-md mt-2 text-center text-slate-900 dark:text-white [&_p]:text-center [&_p]:leading-tight [&_p]:font-bold md:[&_p]:text-lg">
                                    <MarkdownComponent
                                        content={
                                            question.question?.trim() ||
                                            t("quizEditor.settings.typeQuestionHere")
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {/* Answers */}
                        {question.type !== "SLIDE" ? (
                            <ScrollArea className="min-h-0 flex-1 pr-1">
                                <AnswerPreviewGrid
                                    options={question.options}
                                    type={question.type}
                                />
                            </ScrollArea>
                        ) : null}
                    </div>
                </div>
            </div>
        </aside>
    )
}
