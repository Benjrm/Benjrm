// frontend/src/App.tsx

import type { JSX } from "react"
import { useRoutes } from "react-router"
import routes from "./routes"
import { Toaster } from "@/shadcn/components/ui/sonner"

function App(): JSX.Element {
    const routing = useRoutes(routes)

    return (
        <>
            {routing}
            <Toaster position="top-center" />
        </>
    )
}

export default App
