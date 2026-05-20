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
                    setQuizLoadError("The quizzes could not be loaded.")
                }
            } finally {
                if (isMounted) {
                    setLoadingQuizzes(false)
                }
            }
        }

        // Bypasses floating promise rules cleanly with an empty catch callback block
        loadQuizzes().catch(() => {})

        return () => {
            isMounted = false
        }
    }, [])

    const refreshQuizzes = (): void => {
        const load = async (): Promise<void> => {
            try {
                setLoadingQuizzes(true)
                setQuizLoadError(null)

                const data = await getQuizzes()

                setQuizzes(data)
            } catch {
                setQuizLoadError("The quizzes could not be refreshed.")
            } finally {
                setLoadingQuizzes(false)
            }
        }

        // Handles execution chain safely without variables or void keywords
        load().catch(() => {})
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
