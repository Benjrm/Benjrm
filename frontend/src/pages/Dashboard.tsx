// frontend/src/pages/Dashboard.tsx

import type { JSX } from "react"
import GameHeroSection from "../components/GameHeroSection"
import DiscoverSection from "../components/DiscoverSection"

export default function Dashboard(): JSX.Element {
    return (
        <div className="flex w-full flex-col gap-12 py-8">
            <GameHeroSection />
            <DiscoverSection />
        </div>
    )
}
