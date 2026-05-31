import { useRef } from "react"
import type { ReactNode } from "react"
import { Button } from "@/shadcn/components/ui/button"

export default function LogoutButton(): ReactNode {
    const formRef = useRef<HTMLFormElement>(null)
    const handleLogout = () => {
        formRef.current?.submit()
    }

    return (
        <>
            <form ref={formRef} action="/auth/logout" method="POST" style={{ display: "none" }} />
            <Button onClick={handleLogout} variant="default">
                Logout
            </Button>
        </>
    )
}
