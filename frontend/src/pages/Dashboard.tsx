// frontend/src/pages/Dashboard.tsx

import type { JSX } from "react"
import { useEffect, useState } from "react"
import GameHeroSection from "../components/GameHeroSection"
import DiscoverSection from "../components/DiscoverSection"
import CreateQuizModal from "../components/CreateQuizModal"
import { getQuizzes } from "@/api/Quiz"
import type { Quiz } from "@/api/Quiz"

export default function Dashboard(): JSX.Element {
    const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loadingQuizzes, setLoadingQuizzes] = useState(false)
    const [quizLoadError, setQuizLoadError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function loadQuizzes(): Promise<void> {
            try {
                setLoadingQuizzes(true)
                setQuizLoadError(null)

                const data = await getQuizzes()

                if (isMounted) {
                    setQuizzes(data)
                }
            } catch {
                if (isMounted) {
                    setQuizLoadError("Die neuesten Quizzes konnten nicht geladen werden.")
                }
            } finally {
                if (isMounted) {
                    setLoadingQuizzes(false)
                }
            }
        }

        void loadQuizzes()

        return () => {
            isMounted = false
        }
    }, [])

    const refreshQuizzes = (): void => {
        void (async () => {
            try {
                setLoadingQuizzes(true)
                setQuizLoadError(null)

                const data = await getQuizzes()

                setQuizzes(data)
            } catch {
                setQuizLoadError("Die neuesten Quizzes konnten nicht geladen werden.")
            } finally {
                setLoadingQuizzes(false)
            }
        })()
    }

    return (
        <div className="flex w-full flex-col gap-12 py-8">
            <GameHeroSection onAddQuiz={() => setIsCreateQuizOpen(true)} />
            <DiscoverSection error={quizLoadError} loading={loadingQuizzes} quizzes={quizzes} />
            <CreateQuizModal
                isOpen={isCreateQuizOpen}
                onClose={() => setIsCreateQuizOpen(false)}
                onSuccess={() => refreshQuizzes()}
            />
        </div>
    )
}
