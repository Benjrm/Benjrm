// frontend/src/components/QuizCard.tsx

import type { JSX } from "react"
import { Link } from "react-router"
import type { Quiz } from "@/api/Quiz"

interface QuizCardProps {
    quiz: Quiz
}

export default function QuizCard({ quiz }: QuizCardProps): JSX.Element {
    return (
        <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1">
            <div className="relative h-48 overflow-hidden">
                <img
                    alt={quiz.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src="/pictures/happy_people.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
            </div>

            <div className="space-y-4 p-5">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">{quiz.title}</h3>
                    <p className="text-sm leading-6 text-white/60">
                        {quiz.description ?? "No description available yet."}
                    </p>
                </div>

                <Link
                    className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    to={`/quiz/${quiz.id}`}
                >
                    Edit Quiz
                </Link>
            </div>
        </article>
    )
}
