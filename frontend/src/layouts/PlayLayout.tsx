import type { JSX } from "react"
import { Outlet, useParams } from "react-router"
import { useHostWebSocket, usePlayerWebSocket } from "@/api/websocket"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"

export default function PlayLayout(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const { isHost } = useSessionStatus(code)
    useHostWebSocket(isHost ? code : undefined)
    usePlayerWebSocket(!isHost ? code : undefined)
    return <Outlet />
}
