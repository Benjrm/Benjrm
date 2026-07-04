import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import MarkdownPageComponent from "@/shared/views/markdown/MarkdownPageComponent"
import QuestionHeader from "@/features/question/views/QuestionHeader"
import { Button } from "@/shadcn/components/ui/button"

interface InfoSlideContentProps {
    content: string
    playerName?: string
    playerEmoji?: string
    currentSlide?: number
    totalSlides?: number
    isHost?: boolean
    onNextQuestion?: () => void
}

export default function InfoSlideContent({
    content,
    playerName,
    playerEmoji,
    currentSlide = 1,
    totalSlides = 1,
    isHost = false,
    onNextQuestion,
}: Readonly<InfoSlideContentProps>): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="bg-background text-foreground min-h-full px-4 py-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 md:max-w-3xl">
                <QuestionHeader
                    currentQuestion={currentSlide}
                    playerEmoji={playerEmoji}
                    playerName={playerName ?? "Player"}
                    remainingTime={null}
                    totalQuestions={totalSlides}
                />

                {/* Info Slide Card */}
                <div className="bg-card rounded-2xl border border-[#00F2FF] p-8 shadow-lg sm:p-12">
                    {/* Content */}
                    <div className="text-muted-foreground max-w-none space-y-4 text-left text-sm leading-relaxed sm:text-base">
                        <MarkdownPageComponent content={content} />
                    </div>
                </div>
                {/* Image would go here when backend supports it */}

                {isHost && onNextQuestion ? (
                    <div className="mt-8 flex justify-center">
                        <Button
                            className="bg-[#00D4E8] px-8 py-6 text-lg font-bold text-black hover:bg-[#00BDD0]"
                            onClick={onNextQuestion}
                        >
                            {t("game.question.skipNext")}
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
