import { useEffect } from "react"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext.ts"

/**
 * Custom hook that connects to ws(s)://{host}/api/v1/sessions/{code}/ws and handles connection lifecycle management.
 * @param code The session code to connect to.
 */
export default function useWebSocket(code: string): void {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const { host } = window.location
    const wsUrl = `${protocol}://${host}/api/v1/sessions/${code}/ws`

    const websocketService = useWebSocketContext()

    useEffect(() => {
        if (!code) return undefined
        websocketService.connect(wsUrl)
        return () => websocketService.disconnect()
    }, [wsUrl, websocketService, code])
}
