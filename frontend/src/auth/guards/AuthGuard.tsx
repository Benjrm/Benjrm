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
            window.location.replace("/auth/login")
        }
    }, [isError])

    if (isLoading || isError) return null
    return <>{children}</>
}
