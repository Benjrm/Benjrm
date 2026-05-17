// frontend/src/pages/Dashboard.tsx

import GameHeroSection from '../components/GameHeroSection';
import DiscoverSection from '../components/DiscoverSection';

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-12 py-8 w-full">
            <GameHeroSection />
            <DiscoverSection />
        </div>
    );
}
