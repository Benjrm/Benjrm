import type { JSX } from "react"
import LandingPage from "./pages/LandingPage"

function App(): JSX.Element {
    return (
        <div className="flex min-h-screen flex-col">
            <LandingPage />
        </div>
    )
}

export default App
