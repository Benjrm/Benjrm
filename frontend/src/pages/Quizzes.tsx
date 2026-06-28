// frontend/src/pages/Quizzes.tsx

import type { JSX } from "react"
import { useEffect } from "react"
import { toast, Toaster } from "sonner"
import { useTranslation } from "react-i18next"
import QuizCard from "@/components/QuizCard"
import { useQuizzes } from "@/api/quizzes/quizzes.queries.ts"
import type { Quiz } from "@/api/quizzes/quizzes.types.ts"

function renderQuizzesContent(
    sortedQuizzes: Quiz[],
    isLoading: boolean,
    noQuizzesText: string
): JSX.Element | null {
    if (isLoading) {
        return null
    }

    if (sortedQuizzes.length === 0) {
        return <p className="text-muted-foreground mt-4 text-sm">{noQuizzesText}</p>
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
    const { t } = useTranslation()
    const { data: quizzes = [], isLoading, error } = useQuizzes()
    const sortedQuizzes = [...quizzes].sort(
        (firstQuiz, secondQuiz) =>
            new Date(secondQuiz.created).getTime() - new Date(firstQuiz.created).getTime()
    )

    useEffect(() => {
        if (isLoading) {
            toast.loading(t("dashboard.loadingQuizzes"), { id: "quizzes-loading" })
        } else {
            toast.dismiss("quizzes-loading")
            if (error) {
                toast.error(t("dashboard.quizzesError"), { id: "quizzes-error" })
            }
        }
    }, [isLoading, error, t])

    const content = renderQuizzesContent(sortedQuizzes, isLoading, t("dashboard.noQuizzes"))

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {content}
            <Toaster richColors position="bottom-right" />
        </section>
    )
}
