import { useEffect } from "react"
import type { ReactNode } from "react"
import useAuthUser from "@/auth/hooks/useAuthUser.ts"

interface AuthGuardProps {
    children: ReactNode
}

/**
 * Route guard that renders `children` only once {@link useAuthUser} confirms
 * an authenticated session. While loading it renders nothing; on
 * authentication failure it redirects to `/auth/login`, preserving the
 * current path in a `path` query parameter so the login flow can return here.
 */
export default function AuthGuard({ children }: Readonly<AuthGuardProps>): ReactNode {
    const { isLoading, isError } = useAuthUser()

    useEffect(() => {
        if (isError) {
            const baseUrl = new URL(`${window.location.origin}/auth/login`)
            baseUrl.searchParams.set("path", window.location.pathname)
            window.location.replace(baseUrl)
        }
    }, [isError])

    if (isLoading || isError) return null
    return <>{children}</>
}
