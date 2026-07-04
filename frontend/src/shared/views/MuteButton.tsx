import type { JSX } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@shadcn/components/ui/button"
import useAudio from "@/shared/hooks/useAudio.ts"

export default function MuteButton(): JSX.Element | null {
    const { t } = useTranslation()
    const { isAudioActive, isMuted, toggleMute } = useAudio()

    if (!isAudioActive) {
        return null
    }

    const Icon = isMuted ? VolumeX : Volume2

    return (
        <Button
            aria-label={t("common.header.toggleMute")}
            onClick={toggleMute}
            size="icon"
            title={t("common.header.toggleMute")}
            variant="ghost"
        >
            <Icon className="h-5 w-5" />
        </Button>
    )
}
