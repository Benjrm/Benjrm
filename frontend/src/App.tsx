// frontend/src/App.tsx

import type { JSX } from "react"
import { useRoutes } from "react-router"
import routes from "./routes"

function App(): JSX.Element {
    const routing = useRoutes(routes)

    return <>{routing}</>
}

export default App
