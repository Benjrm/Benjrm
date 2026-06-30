import type { JSX } from "react"
import { useEffect, useRef } from "react"
import { Outlet, useParams } from "react-router"
import { useHostWebSocket, usePlayerWebSocket } from "@/api/websocket"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import { useAudio } from "@/context/AudioContext"

export default function PlayLayout(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const { isLoading, isHost } = useSessionStatus(code)
    const wsCode = isLoading ? undefined : code
    useHostWebSocket(isHost ? wsCode : undefined)
    usePlayerWebSocket(!isHost ? wsCode : undefined)

    const { setAudioElement, playAudio } = useAudio()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    useEffect(() => {
        if (audioRef.current === null) {
            audioRef.current = new Audio("/Clear_Path_Ahead.mp3")
            audioRef.current.loop = true
        }
        setAudioElement(audioRef.current)
        playAudio()

        const handleInteraction = (): void => {
            playAudio()
            document.removeEventListener("click", handleInteraction)
            document.removeEventListener("keydown", handleInteraction)
        }
        document.addEventListener("click", handleInteraction)
        document.addEventListener("keydown", handleInteraction)

        return () => {
            document.removeEventListener("click", handleInteraction)
            document.removeEventListener("keydown", handleInteraction)
            setAudioElement(null)
            audioRef.current?.pause()
        }
    }, [setAudioElement, playAudio])

    return <Outlet />
}
