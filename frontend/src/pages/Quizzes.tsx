// frontend/src/pages/Quizzes.tsx

import type { JSX } from "react"
import QuizCard from "@/components/QuizCard"
import { useQuizzes } from "@/api/queries"
import type { Quiz } from "@/api/quiz"

function getReadableErrorMessage(error: Error | null | undefined): string | null {
    if (!error) return null

    return "Quizzes could not be loaded right now."
}

function renderQuizzesContent(sortedQuizzes: Quiz[], isLoading: boolean): JSX.Element {
    if (isLoading) {
        return <p className="text-muted-foreground mt-4 text-sm">Loading quizzes...</p>
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

    const errMessage = getReadableErrorMessage(error)
    const content: JSX.Element = renderQuizzesContent(sortedQuizzes, isLoading)

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {errMessage ? <p className="mt-4 text-sm text-red-500">{errMessage}</p> : null}

            {content}
        </section>
    )
}
