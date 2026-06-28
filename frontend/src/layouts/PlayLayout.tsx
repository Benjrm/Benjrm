import type { JSX } from "react"
import { useEffect, useRef } from "react"
import { Outlet, useParams } from "react-router"
import { useHostWebSocket, usePlayerWebSocket } from "@/api/websocket"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"

export default function PlayLayout(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const { isLoading, isHost } = useSessionStatus(code)
    const wsCode = isLoading ? undefined : code
    useHostWebSocket(isHost ? wsCode : undefined)
    usePlayerWebSocket(!isHost ? wsCode : undefined)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    useEffect(() => {
        const audio = new Audio("/Clear_Path_Ahead.mp3")
        audio.loop = true
        audioRef.current = audio

        const start = (): void => {
            audio.play().catch(() => undefined)
            document.removeEventListener("click", start)
            document.removeEventListener("keydown", start)
        }

        audio.play().catch(() => {
            document.addEventListener("click", start)
            document.addEventListener("keydown", start)
        })

        return () => {
            document.removeEventListener("click", start)
            document.removeEventListener("keydown", start)
            audio.pause()
            audio.src = ""
        }
    }, [])

    return <Outlet />
}
