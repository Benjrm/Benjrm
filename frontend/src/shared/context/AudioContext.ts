import { createContext } from "react"

export interface AudioContextState {
    isAudioActive: boolean
    isMuted: boolean
    toggleMute: () => void
    setAudioElement: (audio: HTMLAudioElement | null) => void
    playAudio: () => void
}

export const AudioContext = createContext<AudioContextState | undefined>(undefined)
