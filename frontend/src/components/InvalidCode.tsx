import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import type { JSX } from "react"
import GamePinForm from "./GamePinForm"

export default function InvalidCode({
    codeWithDash,
    alreadyStarted,
}: {
    codeWithDash?: string
    alreadyStarted?: boolean
}): JSX.Element {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6 py-24">
            <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-500">
                <h1 className="text-base font-bold">{t("lobby.lobbyNotFound.title")}</h1>
                <p className="mt-1 text-sm">
                    {alreadyStarted
                        ? t("lobby.lobbyNotFound.alreadyStarted")
                        : t("lobby.lobbyNotFound.description", { code: codeWithDash })}
                </p>
            </div>
            <GamePinForm
                onJoin={(digits) => {
                    navigate(`/play/${encodeURIComponent(digits)}/game`)
                }}
            />
        </section>
    )
}
