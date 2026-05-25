import { useContext } from "react"
import WebSocketContext from "@/api/websocket/context/WebSocketContext.ts"
import type WebSocketService from "@/api/websocket/service/webSocketService.ts"

/**
 * Custom hook to access the WebSocketContext, which provides the WebsocketService instance for managing WebSocket connections
 * and sending and receiving typed events in a bidirectional way.
 * @returns WebsocketService instance of the WebSocketContext, which provides the WebsocketService instance for managing WebSocket connections and sending and receiving typed events in a bidirectional way.
 * @throws Error if the hook is used outside a WebSocketContext provider.
 */
export default function useWebSocketContext(): WebSocketService {
    const websocketContext = useContext(WebSocketContext)
    if (!websocketContext) {
        throw new Error("useWebSocketContext must be used within a WebSocketContext")
    }
    return websocketContext
}
