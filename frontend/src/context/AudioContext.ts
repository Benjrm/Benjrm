import { createContext, useContext } from "react"

export interface AudioContextState {
    isAudioActive: boolean
    isMuted: boolean
    toggleMute: () => void
    setAudioElement: (audio: HTMLAudioElement | null) => void
    playAudio: () => void
}

export const AudioContext = createContext<AudioContextState | undefined>(undefined)

export function useAudio(): AudioContextState {
    const context = useContext(AudioContext)
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider")
    }
    return context
}
