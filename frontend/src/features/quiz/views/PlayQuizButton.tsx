// frontend/src/components/PlayQuizButton.tsx

import type { JSX } from "react"
import { useTranslation } from "react-i18next"
import useCreateSession from "@/features/session/hooks/useCreateSession"
import { Button } from "@/shadcn/components/ui/button"
import { cn } from "@/shadcn/lib/utils"

export interface PlayQuizButtonProps {
    quizId: string | undefined
    className?: string
    disabled?: boolean
}

export function PlayQuizButton({ quizId, className, disabled }: PlayQuizButtonProps): JSX.Element {
    const { t } = useTranslation()
    const createSessionMutation = useCreateSession()

    const handlePlayQuiz = (): void => {
        if (!quizId) return
        createSessionMutation.mutate({ quiz: quizId })
    }

    return (
        <Button
            disabled={(disabled ?? createSessionMutation.isPending) || !quizId}
            onClick={handlePlayQuiz}
            type="button"
            className={cn(
                "bg-linear-to-r from-[#00F2FF] via-[#00D4E8] to-[#00B8FF] font-bold text-black shadow-[0_0_20px_-5px_rgba(0,212,232,0.6)] transition-all hover:from-[#00d8e4] hover:via-[#00cfe0] hover:to-[#009fe0]",
                className
            )}
        >
            {createSessionMutation.isPending
                ? t("quiz.playButton.starting")
                : t("quiz.playButton.play")}
        </Button>
    )
}
