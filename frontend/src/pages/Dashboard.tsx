// frontend/src/pages/Dashboard.tsx

import type { JSX } from "react"
import { useState } from "react"
import GameHeroSection from "../components/GameHeroSection"
import DiscoverSection from "../components/DiscoverSection"
import CreateQuizModal from "../components/CreateQuizModal"
import { useQuizzes } from "@/api/Queries"

export default function Dashboard(): JSX.Element {
    const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)

    // Query for loading quizzes
    const { data: quizzes = [], isLoading: loadingQuizzes, error } = useQuizzes()

    const quizLoadError = error?.message ?? null

    const handleCreateSuccess = (): void => {
        setIsCreateQuizOpen(false)
    }

    return (
        <div className="flex w-full flex-col gap-12 py-8">
            <GameHeroSection onAddQuiz={() => setIsCreateQuizOpen(true)} />
            <DiscoverSection error={quizLoadError} loading={loadingQuizzes} quizzes={quizzes} />
            <CreateQuizModal
                isOpen={isCreateQuizOpen}
                onClose={() => setIsCreateQuizOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}
