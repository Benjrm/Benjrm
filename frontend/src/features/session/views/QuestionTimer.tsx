import { useEffect, useState } from "react"
import type { JSX } from "react"
import { useTranslation } from "react-i18next"

interface QuestionTimerProps {
    expiresAt: number | null
}

export default function QuestionTimer({
    expiresAt,
}: Readonly<QuestionTimerProps>): JSX.Element | null {
    const { t } = useTranslation()
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!expiresAt) return undefined
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [expiresAt])

    if (!expiresAt) return null
    const secs = Math.max(0, Math.ceil((expiresAt - now) / 1000))

    return (
        <span className={`text-sm font-black ${secs <= 5 ? "text-red-400" : "text-[#FF8A00]"}`}>
            {secs > 0 ? t("game.host.timeLeft", { secs }) : t("game.host.timesUp")}
        </span>
    )
}
