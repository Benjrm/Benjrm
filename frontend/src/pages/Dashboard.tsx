// frontend/src/pages/Dashboard.tsx
import type { JSX } from "react"
import { useState } from "react"
import GameHeroSection from "../components/GameHeroSection"
import DiscoverSection from "../components/DiscoverSection"
import CreateQuizModal from "../components/CreateQuizModal"
import { useQuizzes } from "@/api/queries"

function getQuizLoadErrorMessage(error: Error | null | undefined): string | null {
    if (!error) return null

    if (/did not match the expected pattern/i.test(error.message)) {
        return "Quizzes could not be loaded right now."
    }

    return "Quizzes could not be loaded right now."
}

export default function Dashboard(): JSX.Element {
    const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)

    const { data: quizzes = [], isLoading: loadingQuizzes, error } = useQuizzes()
    const quizLoadError = getQuizLoadErrorMessage(error)

    const handleCreateSuccess = (): void => {
        setIsCreateQuizOpen(false)
    }

    return (
        <div className="flex w-full flex-col gap-12 py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-6 px-4 sm:px-6">
                <GameHeroSection onAddQuizClick={() => setIsCreateQuizOpen(true)} />
            </div>

            <DiscoverSection
                error={quizLoadError}
                loading={loadingQuizzes}
                onCreateQuizClick={() => setIsCreateQuizOpen(true)}
                quizzes={quizzes}
            />
            <CreateQuizModal
                isOpen={isCreateQuizOpen}
                onClose={() => setIsCreateQuizOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}
