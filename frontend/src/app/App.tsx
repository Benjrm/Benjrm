import type { JSX } from "react"
import { useEffect } from "react"
import { useLocation, useRoutes } from "react-router"
import routes from "./routes"

function ScrollToTop(): null {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

function App(): JSX.Element {
    const routing = useRoutes(routes)

    return (
        <>
            <ScrollToTop />
            {routing}
        </>
    )
}

export default App
