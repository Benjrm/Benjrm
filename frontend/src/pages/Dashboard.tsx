// frontend/src/pages/Dashboard.tsx
import type { JSX } from "react"
import { useState, useEffect } from "react"
import { toast, Toaster } from "sonner"
import { useTranslation } from "react-i18next"
import GameHeroSection from "../components/GameHeroSection"
import DiscoverSection from "../components/DiscoverSection"
import CreateQuizModal from "../components/CreateQuizModal"
import { useQuizzes } from "@/api/quizzes/quizzes.queries.ts"

export default function Dashboard(): JSX.Element {
    const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)
    const { t } = useTranslation()

    const { data: quizzes = [], isLoading: loadingQuizzes, error } = useQuizzes()

    useEffect(() => {
        if (loadingQuizzes) {
            toast.loading(t("dashboard.loadingQuizzes"), { id: "quizzes-loading" })
        } else {
            toast.dismiss("quizzes-loading")
            if (error) {
                toast.error(t("dashboard.quizzesError"), { id: "quizzes-error" })
            }
        }
    }, [loadingQuizzes, error, t])

    const handleCreateSuccess = (): void => {
        setIsCreateQuizOpen(false)
    }

    return (
        <div className="flex w-full flex-col gap-12 py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-6 px-4 sm:px-6">
                <GameHeroSection onAddQuizClick={() => setIsCreateQuizOpen(true)} />
            </div>

            <DiscoverSection
                loading={loadingQuizzes}
                onCreateQuizClick={() => setIsCreateQuizOpen(true)}
                quizzes={quizzes}
            />
            <CreateQuizModal
                isOpen={isCreateQuizOpen}
                onClose={() => setIsCreateQuizOpen(false)}
                onSuccess={handleCreateSuccess}
            />
            <Toaster richColors position="bottom-right" />
        </div>
    )
}
