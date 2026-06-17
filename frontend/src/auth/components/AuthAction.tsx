import type { ReactNode } from "react"
import useAuthUser from "@/auth/hooks/useAuthUser.ts"
import LoginLink from "@/auth/components/LoginLink.tsx"
import LogoutButton from "@/auth/components/LogoutButton.tsx"

export default function AuthAction(): ReactNode {
    const { data: isAuthenticated, isLoading } = useAuthUser()

    if (isLoading) return null
    return isAuthenticated ? <LogoutButton /> : <LoginLink />
}
