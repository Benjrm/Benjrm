import type { JSX } from "react"
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
    return <Outlet />
}
