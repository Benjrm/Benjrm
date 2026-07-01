import { useCallback, useMemo, useRef, useState } from "react"
import type { JSX, ReactNode } from "react"
import { AudioContext } from "@/shared/context/AudioContext"

export default function AudioProvider({ children }: { children: ReactNode }): JSX.Element {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const isMutedRef = useRef(false)
    const [isAudioActive, setIsAudioActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    const setAudioElement = useCallback((audio: HTMLAudioElement | null): void => {
        audioRef.current = audio
        setIsAudioActive(audio !== null)
    }, [])

    // Start playback using muted autoplay (always permitted by browsers), then unmute.
    // Callers should also register a click/keydown fallback in case autoplay is blocked.
    const playAudio = useCallback((): void => {
        const el = audioRef.current
        if (!el?.paused) return
        el.muted = true
        el.play()
            .then(() => {
                el.muted = isMutedRef.current
            })
            .catch(() => undefined)
    }, [])

    const toggleMute = useCallback((): void => {
        const next = !isMutedRef.current
        isMutedRef.current = next
        setIsMuted(next)
        if (audioRef.current !== null) {
            audioRef.current.muted = next
        }
    }, [])

    const value = useMemo(
        () => ({ isAudioActive, isMuted, toggleMute, setAudioElement, playAudio }),
        [isAudioActive, isMuted, toggleMute, setAudioElement, playAudio]
    )

    return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}
