import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { JSX, ReactNode } from "react"
import { AudioContext } from "@/context/AudioContext"

export default function AudioProvider({ children }: { children: ReactNode }): JSX.Element {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isAudioActive, setIsAudioActive] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    const setAudioElement = useCallback((audio: HTMLAudioElement | null): void => {
        audioRef.current = audio
        setIsAudioActive(audio !== null)
    }, [])

    const toggleMute = useCallback((): void => {
        setIsMuted((prev) => !prev)
    }, [])

    useEffect(() => {
        if (audioRef.current !== null) {
            audioRef.current.muted = isMuted
        }
    }, [isMuted, isAudioActive])

    const value = useMemo(
        () => ({ isAudioActive, isMuted, toggleMute, setAudioElement }),
        [isAudioActive, isMuted, toggleMute, setAudioElement]
    )

    return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}
