// frontend/src/components/DiscoverSection.tsx

import type { JSX } from "react"
import QuizCard from "@/components/QuizCard"
import CategoryHeader from "@/components/CategoryHeader"
import type { Quiz } from "@/api/Quiz.tsx"

interface DiscoverSectionProps {
    quizzes: Quiz[]
    loading: boolean
    error: string | null
}

export default function DiscoverSection({
    quizzes,
    loading,
    error,
}: DiscoverSectionProps): JSX.Element {
    const recentQuizzes = [...quizzes]
        .sort(
            (firstQuiz, secondQuiz) =>
                new Date(secondQuiz.created).getTime() - new Date(firstQuiz.created).getTime()
        )
        .slice(0, 4)

    return (
        <section className="w-full space-y-10">
            <p className="text-md font-bold tracking-widest text-[#FF8A00] uppercase">Discover</p>

            <CategoryHeader
                description="All quizzes for you to discover"
                title="All Quizzes"
                to="/quiz"
            />

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            {loading && recentQuizzes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Loading quizzes...</p>
            ) : null}

            {!loading && recentQuizzes.length === 0 && !error ? (
                <p className="text-muted-foreground text-sm">
                    No quizzes yet. Create your first one above.
                </p>
            ) : null}

            {recentQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {recentQuizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            ) : null}
        </section>
    )
}
