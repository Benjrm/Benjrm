import type { JSX } from "react"
import LandingPage from "./pages/LandingPage"
import ImprintPage from './pages/ImprintPage';

function App(): JSX.Element {
    return (
        <div className="flex min-h-screen flex-col">
            {/* <LandingPage /> */}
            <ImprintPage />
        </div>
    )
}

export default App
