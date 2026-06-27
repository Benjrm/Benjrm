import { useRef } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shadcn/components/ui/button"

export default function LogoutButton(): ReactNode {
    const { t } = useTranslation()
    const formRef = useRef<HTMLFormElement>(null)
    const handleLogout = () => {
        formRef.current?.submit()
    }

    return (
        <>
            <form ref={formRef} action="/auth/logout" method="POST" style={{ display: "none" }} />
            <Button onClick={handleLogout} variant="default">
                {t("common.header.logout")}
            </Button>
        </>
    )
}
