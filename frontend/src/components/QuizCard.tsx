// frontend/src/components/QuizCard.tsx

import type { JSX } from "react"
import { Link } from "react-router"
import type { Quiz } from "@/api/quiz"

interface QuizCardProps {
    quiz: Quiz
}

export default function QuizCard({ quiz }: QuizCardProps): JSX.Element {
    return (
        <article className="group overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-transform duration-300 hover:-translate-y-1 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="relative h-48 overflow-hidden">
                <img
                    alt={quiz.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src="/pictures/happy_people.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent dark:from-black dark:via-black/15" />
            </div>

            <div className="space-y-4 p-5">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-card-foreground">{quiz.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {quiz.description ?? "No description available yet."}
                    </p>
                </div>

                <Link
                    className="inline-flex items-center rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    to={`/quiz/${quiz.id}`}
                >
                    Edit Quiz
                </Link>
            </div>
        </article>
    )
}
