import { createContext } from "react"

/** Shape of the value exposed by `AudioProvider` / consumed via `useAudio`. */
export interface AudioContextState {
    /** Whether an `<audio>` element is currently registered via `setAudioElement`. */
    isAudioActive: boolean
    /** Whether playback is currently muted. */
    isMuted: boolean
    /** Toggles the muted state of the registered audio element. */
    toggleMute: () => void
    /** Registers (or clears, with `null`) the `<audio>` element to control. */
    setAudioElement: (audio: HTMLAudioElement | null) => void
    /** Starts playback, working around browser autoplay restrictions (see `AudioProvider`). */
    playAudio: () => void
}

/** React context holding the shared audio-playback controls. Populated by `AudioProvider`. */
export const AudioContext = createContext<AudioContextState | undefined>(undefined)
