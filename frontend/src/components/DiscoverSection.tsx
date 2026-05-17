// frontend/src/components/DiscoverSection.tsx

import type { JSX } from "react"
import CategoryHeader from "@/components/CategoryHeader"

export default function DiscoverSection(): JSX.Element {
    return (
        <section className="w-full space-y-10">
            <p className="text-md font-bold tracking-widest text-[#FF8A00] uppercase">Discover</p>

            <CategoryHeader
                description="All quizzes for you to discover"
                title="All Quizzes"
                to="/quizzes"
            />
        </section>
    )
}
