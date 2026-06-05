/**
 * Package for WebSocket-related API hooks.
 * It supports managing WebSocket connection lifecycle and event handling for sending and receiving typed events in a bidirectional way.
 */
import useWebSocket from "@/api/websocket/hooks/useWebSocket.ts"
import useSocketEvent from "@/api/websocket/hooks/useSocketEvent.ts"
import useWebSocketContext from "@/api/websocket/hooks/useWebSocketContext.ts"
import WebSocketContext from "@/api/websocket/context/WebSocketContext.ts"
import websocketService from "@/api/websocket/service/singleton.ts"

export { useWebSocket, useSocketEvent, useWebSocketContext, WebSocketContext, websocketService }

// How to import:
// import { useWebSocket } from "@/api/websocket"
// import { useSocketEvent } from "@/api/websocket"
// import { useWebSocketContext } from "@/api/websocket"
// import { WebSocketContext } from "@/api/websocket"
// import { webSocketService } from "@/api/websocket"
// import { useWebSocket, useSocketEvent, useWebSocketContext, WebSocketContext } from "@/api/websocket"
