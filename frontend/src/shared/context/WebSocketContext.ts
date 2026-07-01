import { createContext } from "react"
import type WebSocketService from "@/shared/utils/webSocketService.ts"

/**
 * Context providing the WebSocketService instance to components that need to interact with the WebSocket connection.
 * This avoids passing props down through multiple levels of components and allows any component to access the WebSocketService directly.
 */
const WebSocketContext = createContext<WebSocketService | null>(null)
export default WebSocketContext
