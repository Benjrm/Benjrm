// frontend/src/components/DiscoverSection.tsx

import type { JSX } from "react"
import { PlusSquare } from "lucide-react"
import { useTranslation } from "react-i18next"
import QuizCard from "@/features/quiz/views/QuizCard"
import CategoryHeader from "@/shared/views/CategoryHeader"
import { Button } from "@/shadcn/components/ui/button"
import type { Quiz } from "@/features/quiz/types/quizzes.types.ts"

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
    const { t } = useTranslation()
    const recentQuizzes = [...quizzes]
        .sort(
            (firstQuiz, secondQuiz) =>
                new Date(secondQuiz.created).getTime() - new Date(firstQuiz.created).getTime()
        )
        .slice(0, 3)

    return (
        <section className="w-full space-y-10">
            <p className="text-md font-bold tracking-widest text-[#FF8A00] uppercase">
                {t("dashboard.discover.title")}
            </p>

            <CategoryHeader
                description={t("dashboard.discover.recentQuizzes")}
                title={t("dashboard.discover.yourQuizzes")}
                to="/quizzes"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Button
                    className="flex h-full min-h-[250px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-[#00D4E8] to-[#00AFC0] p-6 text-xl font-extrabold text-black shadow-[0_8px_30px_-8px_rgba(0,212,232,0.6)] transition-transform hover:scale-105 active:scale-100"
                    onClick={onCreateQuizClick}
                >
                    <PlusSquare className="h-12 w-12" />
                    <span className="tracking-wide">{t("dashboard.hero.addQuiz")}</span>
                </Button>

                {!loading &&
                    recentQuizzes.length > 0 &&
                    recentQuizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>
    )
}
