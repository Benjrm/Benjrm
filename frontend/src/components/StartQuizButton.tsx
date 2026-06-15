import type { ReactNode } from "react"
import { Button } from "@/shadcn/components/ui/button"

interface StartQuizButtonProps {
    disabled?: boolean
    onClick: () => void
}

export default function StartQuizButton({ disabled, onClick }: StartQuizButtonProps): ReactNode {
    return (
        <Button
            className="rounded-xl border-0 bg-[#00D4E8] px-8 py-5 text-sm font-bold tracking-wide text-black uppercase shadow-[0_0_20px_-5px_rgba(0,212,232,0.6)] transition-all hover:bg-[#00BDD0]"
            disabled={disabled}
            onClick={onClick}
            size="lg"
            type="button"
        >
            Start Game
        </Button>
    )
}
