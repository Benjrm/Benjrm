import { useEffect } from "react"
import type { ReactNode } from "react"

export default function LoginRedirect(): ReactNode {
    useEffect(() => {
        window.location.href = "/auth/login"
    }, [])
    return null
}
