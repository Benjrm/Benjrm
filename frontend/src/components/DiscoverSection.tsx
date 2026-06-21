// frontend/src/components/DiscoverSection.tsx

import type { JSX } from "react"
import { PlusSquare } from "lucide-react"
import QuizCard from "@/components/QuizCard"
import CategoryHeader from "@/components/CategoryHeader"
import { Button } from "@/shadcn/components/ui/button"
import type { Quiz } from "@/api/quizzes/quizzes.types.ts"

interface DiscoverSectionProps {
    quizzes: Quiz[]
    loading: boolean
    onCreateQuizClick: () => void
}

export default function DiscoverSection({
    quizzes,
    loading,
    onCreateQuizClick,
}: DiscoverSectionProps): JSX.Element {
    const recentQuizzes = [...quizzes]
        .sort(
            (firstQuiz, secondQuiz) =>
                new Date(secondQuiz.created).getTime() - new Date(firstQuiz.created).getTime()
        )
        .slice(0, 3)

    return (
        <section className="w-full space-y-10">
            <p className="text-md font-bold tracking-widest text-[#FF8A00] uppercase">Discover</p>

            <CategoryHeader description="Most Recent Quizzes" title="Your Quizzes" to="/quizzes" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Button
                    className="flex h-full min-h-[250px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-[#00D4E8] to-[#00AFC0] p-6 text-xl font-extrabold text-black shadow-[0_8px_30px_-8px_rgba(0,212,232,0.6)] transition-transform hover:scale-105 active:scale-100"
                    onClick={onCreateQuizClick}
                >
                    <PlusSquare className="h-12 w-12" />
                    <span className="tracking-wide">Add Quiz</span>
                </Button>

                {!loading &&
                    recentQuizzes.length > 0 &&
                    recentQuizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>
    )
}
