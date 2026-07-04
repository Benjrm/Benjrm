import type { JSX } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import PlayQuizButton from "@/features/quiz/views/PlayQuizButton"
import type { Quiz } from "@/features/quiz/types/quizzes.ts"

interface QuizCardProps {
    quiz: Quiz
}

export default function QuizCard({ quiz }: Readonly<QuizCardProps>): JSX.Element {
    const { t } = useTranslation()

    return (
        <article className="group border-border bg-card text-card-foreground overflow-hidden rounded-2xl border shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-transform duration-300 hover:-translate-y-1 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="relative h-48 overflow-hidden">
                <img
                    alt={quiz.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src="/pictures/happy_people.jpg"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent dark:from-black dark:via-black/15" />
            </div>

            <div className="space-y-4 p-5">
                <div className="space-y-2">
                    <h3 className="text-card-foreground text-lg font-medium">{quiz.title}</h3>
                    <p className="text-muted-foreground text-sm leading-6">
                        {quiz.description ?? t("quiz.card.noDescription")}
                    </p>
                </div>

                <Link
                    className="border-border bg-background/70 text-foreground hover:bg-muted inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                    to={`/quiz/${quiz.id}`}
                >
                    {t("quiz.card.editQuiz")}
                </Link>
                <PlayQuizButton className="mx-4 rounded-full" quizId={quiz.id} />
            </div>
        </article>
    )
}
