import { useEffect } from "react"
import useWebSocketContext from "@/shared/hooks/useWebSocketContext.ts"

/**
 * Custom hook that connects to ws(s)://{host}/api/v1/sessions/{code}/{path} and handles connection lifecycle management.
 * @param code The session code to connect to.
 * @param path The WebSocket path segment appended after the session code. Defaults to "ws".
 */
export default function useWebSocket(code: number | string | undefined, path = "ws"): void {
    const websocketService = useWebSocketContext()

    useEffect(() => {
        if (!code) return undefined

        const protocol = window.location.protocol === "https:" ? "wss" : "ws"
        const { host } = window.location
        const wsUrl = `${protocol}://${host}/api/v1/sessions/${code}/${path}`

        websocketService.connect(wsUrl)
        const unsubscribe = websocketService.subscribe("ping", (payload: { id: number }) => {
            websocketService.send({
                command: "pong",
                payload: {
                    id: payload.id,
                    timestamp: new Date().toISOString(),
                },
            })
        })
        return () => {
            unsubscribe()
            websocketService.disconnect()
        }
    }, [code, path, websocketService])
}
