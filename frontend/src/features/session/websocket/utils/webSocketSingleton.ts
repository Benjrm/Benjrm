import WebSocketService from "@/features/session/websocket/utils/webSocketService.ts"

/**
 * App-wide {@link WebSocketService} instance, provided to the tree via
 * `WebSocketContext` so all game-session components share one connection.
 */
const websocketService = new WebSocketService()
export default websocketService
