import { useContext } from "react"
import { AudioContext } from "@/shared/context/AudioContext.ts"
import type { AudioContextState } from "@/shared/context/AudioContext.ts"

/**
 * Accesses the shared {@link AudioContextState} provided by `AudioProvider`.
 *
 * @throws {Error} If called outside of an `AudioProvider`.
 */
export default function useAudio(): AudioContextState {
    const context = useContext(AudioContext)
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider")
    }
    return context
}
