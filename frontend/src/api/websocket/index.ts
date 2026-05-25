/**
 * Package for WebSocket-related API hooks.
 * It supports managing WebSocket connection lifecycle and event handling for sending and receiving typed events in a bidirectional way.
 */
import useWebSocket from "@/api/websocket/hooks/useWebSocket.ts"
import useSocketEvent from "@/api/websocket/hooks/useSocketEvent.ts"

export { useWebSocket, useSocketEvent }

// How to import:
// import { useWebSocket } from "@/api/websocket"
// import { useSocketEvent } from "@/api/websocket"
// import { useWebSocket, useSocketEvent } from "@/api/websocket"
