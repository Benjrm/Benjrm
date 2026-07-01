import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shadcn/components/ui/button"

interface StartQuizButtonProps {
    onStartQuiz: () => void
    disabled?: boolean
}

export default function StartQuizButton({
    onStartQuiz,
    disabled,
}: StartQuizButtonProps): ReactNode {
    const { t } = useTranslation()
    return (
        <Button
            className="rounded-xl border-0 bg-[#00D4E8] px-8 py-5 text-sm font-bold tracking-wide text-black uppercase shadow-[0_0_20px_-5px_rgba(0,212,232,0.6)] transition-all hover:bg-[#00BDD0] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={onStartQuiz}
            size="lg"
            type="button"
        >
            {t("lobby.startGame")}
        </Button>
    )
}
