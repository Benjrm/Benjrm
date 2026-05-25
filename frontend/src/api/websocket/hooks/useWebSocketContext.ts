import { useContext } from "react"
import WebSocketContext from "@/api/websocket/context/WebSocketContext.ts"
import type { WebsocketService } from "@/api/websocket/service/websocketService.ts"

export default function useWebSocketContext(): WebsocketService {
    const websocketContext = useContext(WebSocketContext)
    if (!websocketContext) {
        throw new Error("useWebSocketContext must be used within a WebSocketContext")
    }
    return websocketContext
}
