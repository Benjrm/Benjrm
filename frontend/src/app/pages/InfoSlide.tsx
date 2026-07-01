// frontend/src/pages/InfoSlide.tsx

import type { JSX } from "react"
import InfoSlideContent from "@/features/question/views/InfoSlideContent"

// Mock data for now - will be replaced with API data later
const MOCK_INFOSLIDE = {
    content:
        "# HTML als Auszeichnungssprache\n\nHTML (HyperText Markup Language) ist die Standardauszeichnungssprache zur Erstellung von Webseiten. Sie wird verwendet, um Inhalte zu strukturieren und zu formatieren. Mit HTML können Sie Text, Bilder, Links und andere Medien in einem strukturierten Format darstellen.",
    playerName: "Funny Crocodile",
    currentSlide: 1,
    totalSlides: 3,
}

export default function InfoSlide(): JSX.Element {
    return (
        <InfoSlideContent
            content={MOCK_INFOSLIDE.content}
            currentSlide={MOCK_INFOSLIDE.currentSlide}
            playerName={MOCK_INFOSLIDE.playerName}
            totalSlides={MOCK_INFOSLIDE.totalSlides}
        />
    )
}
