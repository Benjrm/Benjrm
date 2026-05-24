import { useEffect } from "react"
import type { WebsocketService } from "@/api/websocket/service/websocketService.ts";
import { websocketService } from "@/api/websocket/service/websocketService.ts"

export default function useWebSocket(code: number): WebsocketService {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const { host } = window.location
    const wsUrl = `${protocol}://${host}/sessions/${code}/ws`

    useEffect(() => {
        websocketService.connect(wsUrl)
        return () => websocketService.disconnect()
    }, [wsUrl])
    return websocketService
}
