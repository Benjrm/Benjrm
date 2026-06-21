// frontend/src/pages/Quizzes.tsx

import type { JSX } from "react"
import { useEffect } from "react"
import { toast, Toaster } from "sonner"
import QuizCard from "@/components/QuizCard"
import { useQuizzes } from "@/api/quizzes/quizzes.queries.ts"
import type { Quiz } from "@/api/quizzes/quizzes.types.ts"

function renderQuizzesContent(sortedQuizzes: Quiz[], isLoading: boolean): JSX.Element | null {
    if (isLoading) {
        return null
    }

    if (sortedQuizzes.length === 0) {
        return <p className="text-muted-foreground mt-4 text-sm">No quizzes available.</p>
    }

    return (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedQuizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
            ))}
        </div>
    )
}

export default function Quizzes(): JSX.Element {
    const { data: quizzes = [], isLoading, error } = useQuizzes()
    const sortedQuizzes = [...quizzes].sort(
        (firstQuiz, secondQuiz) =>
            new Date(secondQuiz.created).getTime() - new Date(firstQuiz.created).getTime()
    )

    useEffect(() => {
        if (isLoading) {
            toast.loading("Loading quizzes...", { id: "quizzes-loading" })
        } else {
            toast.dismiss("quizzes-loading")
            if (error) {
                toast.error("Quizzes could not be loaded right now.", { id: "quizzes-error" })
            }
        }
    }, [isLoading, error])

    const content = renderQuizzesContent(sortedQuizzes, isLoading)

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {content}
            <Toaster richColors position="bottom-right" />
        </section>
    )
}
