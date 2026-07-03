import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import MarkdownComponent from "@/shared/views/markdown/MarkdownComponent.tsx"
import TimerBar from "@/features/question/views/TimerBar.tsx"

interface QuestionPreviewProps {
    question: { text: string }
    remainingTime: number
}

export default function QuestionPreview({
    question,
    remainingTime,
}: Readonly<QuestionPreviewProps>): JSX.Element {
    const { t } = useTranslation()

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 px-6 text-center">
            <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
                {t("game.getReady")}
            </p>
            <div className="bg-card text-card-foreground w-full max-w-xl rounded-2xl border px-8 py-10 shadow-lg">
                <div className="text-3xl font-extrabold sm:text-4xl [&_p]:m-0 [&_p]:text-3xl [&_p]:font-extrabold sm:[&_p]:text-4xl">
                    <MarkdownComponent content={question.text} />
                </div>
            </div>
            <div className="w-full max-w-xl overflow-hidden">
                <TimerBar fastAnimation timeLeft={remainingTime} totalSeconds={3} />
            </div>
        </div>
    )
}
