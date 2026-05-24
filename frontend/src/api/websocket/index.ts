/**
 * Package for WebSocket-related API hooks.
 * It supports WebSocket connections and event handling for sending and receiving messages bidirectional.
 */
import useWebSocket from "@/api/websocket/hooks/useWebSocket.ts"
import useSocketEvent from "@/api/websocket/hooks/useSocketEvent.ts"

export { useWebSocket, useSocketEvent }

// How to import:
// import { useWebSocket } from "@/api/websocket"
// import { useSocketEvent } from "@/api/websocket"
// import { useWebSocket, useSocketEvent } from "@/api/websocket"
