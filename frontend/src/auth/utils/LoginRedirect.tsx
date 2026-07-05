import { useEffect } from "react"
import type { ReactNode } from "react"

/**
 * Route target that immediately hard-navigates the browser to the backend's
 * OIDC login endpoint (`/auth/login`), starting the login flow.
 */
export default function LoginRedirect(): ReactNode {
    useEffect(() => {
        window.location.href = "/auth/login"
    }, [])
    return null
}
