import { useEffect } from "react"
import type { ReactNode } from "react"
import useAuthUser from "@/auth/hooks/useAuthUser.ts"

interface AuthGuardProps {
    children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps): ReactNode {
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
