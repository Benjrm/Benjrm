// frontend/src/pages/Quizzes.tsx

import type { JSX } from "react"
import QuizCard from "@/components/QuizCard"
import { useQuizzes } from "@/api/queries"

export default function Quizzes(): JSX.Element {
    const { data: quizzes = [], isLoading, error } = useQuizzes()

    const errMessage = (error as Error | null | undefined)?.message ?? null
    let content: JSX.Element

    if (isLoading) {
        content = <p className="text-muted-foreground mt-4 text-sm">Loading quizzes...</p>
    } else if (quizzes.length === 0) {
        content = <p className="text-muted-foreground mt-4 text-sm">No quizzes available.</p>
    } else {
        content = (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                ))}
            </div>
        )
    }

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {errMessage ? <p className="mt-4 text-sm text-red-500">{errMessage}</p> : null}

            {content}
        </section>
    )
}
