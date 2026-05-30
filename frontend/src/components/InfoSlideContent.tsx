// frontend/src/components/InfoSlideContent.tsx

import type { JSX } from "react"

interface InfoSlideContentProps {
    title: string
    content: string
    playerName?: string
    currentSlide?: number
    totalSlides?: number
}

export default function InfoSlideContent({
    title,
    content,
    playerName = "Funny Crocodile",
    currentSlide = 1,
    totalSlides = 1,
}: InfoSlideContentProps): JSX.Element {
    return (
        <div className="bg-background text-foreground min-h-full px-4 py-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 md:max-w-3xl">
                {/* Header */}
                <div className="relative flex items-center justify-center">
                    <div className="border-border/50 bg-muted/30 flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm">
                        <span className="text-sm font-medium">👤</span>
                        <span className="text-sm font-medium">{playerName}</span>
                    </div>
                    {totalSlides > 1 && (
                        <div className="text-muted-foreground absolute right-0 text-sm font-semibold">
                            {currentSlide} / {totalSlides}
                        </div>
                    )}
                </div>

                {/* Info Slide Card */}
                <div className="bg-card rounded-2xl border border-[#00F2FF] p-8 shadow-lg sm:p-12">
                    {/* Title */}
                    <h1 className="text-foreground mb-6 text-center text-2xl font-bold sm:text-3xl">
                        {title}
                    </h1>

                    {/* Content */}
                    <div className="text-muted-foreground max-w-none space-y-4 text-center text-sm leading-relaxed sm:text-base">
                        <p>{content}</p>
                    </div>
                </div>
                {/* Image would go here when backend supports it */}
            </div>
        </div>
    )
}
