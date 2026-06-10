import type { ClientMessage } from "@/api/websocket/types/clientMessage.ts"
import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"
import type { AnyServerEventHandler } from "@/api/websocket/types/anyServerEventHandler.ts"
import type { ServerEventHandler } from "@/api/websocket/types/serverEventHandler.ts"
import type { ServerMessage } from "@/api/websocket/types/serverMessage.ts"

/**
 * Service for managing WebSocket connection lifecycle, sending messages, and handling incoming messages with a publish-subscribe pattern.
 */
export default class WebSocketService {
    private socket: WebSocket | null = null

    private listeners = new Map<keyof ServerEvents, Set<AnyServerEventHandler>>()

    private static async decodeMessageData(data: MessageEvent["data"]): Promise<string | null> {
        if (typeof data === "string") {
            return data
        }
        if (data instanceof Blob) {
            return data.text()
        }
        if (data instanceof ArrayBuffer) {
            return new TextDecoder().decode(data)
        }
        if (ArrayBuffer.isView(data)) {
            return new TextDecoder().decode(data)
        }
        return null
    }

    private cleanup(ws: WebSocket): void {
        console.log("Disconnected")
        if (this.socket === ws) {
            this.socket = null
        }
        // Since some components may still be connected and continue to expect messages after the connection is reestablished, we do not remove the listener here.
    }

    /**
     * Connects to the specified WebSocket server URL.
     * If already connected to the same URL and the connection is open, it does nothing.
     * Handles onopen, onmessage, onclose, and onerror events to manage connection state and message processing.
     * @param url The URL of the target WebSocket server to connect to.
     */
    public connect(url: string): void {
        if (this.socket?.url === url && this.socket.readyState === WebSocket.OPEN) {
            return
        }

        // Removes the onclose handler to prevent the status of the new socket from being cleared.
        // Closes the old socket only if a connection to a new one is established.
        if (this.socket) {
            this.socket.onclose = null
            this.socket.close()
        }

        const ws = new WebSocket(url)
        this.socket = ws

        ws.onopen = () => {
            console.log("Connected")
        }

        ws.onmessage = async (event) => {
            try {
                const message = await WebSocketService.decodeMessageData(event.data)
                if (message === null) {
                    console.error("Received unsupported WebSocket message type:", event.data)
                    return
                }
                const raw = JSON.parse(message)
                if (
                    typeof raw !== "object" ||
                    raw === null ||
                    !("command" in raw) ||
                    typeof raw.command !== "string"
                ) {
                    console.error("Received invalid WebSocket message:", raw)
                    return
                }
                const data = raw as ServerMessage
                const handlers = this.listeners.get(data.command)
                handlers?.forEach((handler) =>
                    (handler as ServerEventHandler<typeof data.command>)(data.payload, data.timing)
                )
            } catch (error) {
                console.error("Failed to process WebSocket message:", error)
            }
        }

        ws.onclose = () => {
            this.cleanup(ws)
        }

        ws.onerror = (error) => {
            console.error("WebSocket error:", error)
        }
    }

    /**
     * Closes the socket connection.
     * If the socket does not exist or the connection is already closed, it does nothing.
     */
    public disconnect(): void {
        if (!this.socket) {
            return
        }
        this.socket.close()
        this.socket = null
    }

    /**
     * Sends a message to the WebSocket server.
     * @param message The message to send to the WebSocket server.
     * @throws Error if the socket is not connected or not open.
     */
    public send(message: ClientMessage): void {
        if (!this.socket) {
            throw new Error("Cannot send WebSocket message: socket is not connected.")
        }
        if (this.socket.readyState !== WebSocket.OPEN) {
            throw new Error(
                `Cannot send WebSocket message: socket is not open (readyState: ${this.socket.readyState}).`
            )
        }
        this.socket.send(JSON.stringify(message))
    }

    /**
     * Subscribes a handler function to a specific server command. The handler will be invoked whenever a message with the specified command is received from the server.
     * @param command The server command to subscribe to.
     * @param handler The handler method to invoke when a message with the specified command is received from the server.
     * @return A function that can be called to unsubscribe the handler from the specified command.
     */
    public subscribe<K extends keyof ServerEvents>(
        command: K,
        handler: ServerEventHandler<K>
    ): () => void {
        if (!this.listeners.has(command)) {
            this.listeners.set(command, new Set())
        }
        this.listeners.get(command)?.add(handler as AnyServerEventHandler)
        return () => {
            this.listeners.get(command)?.delete(handler as AnyServerEventHandler)
        }
    }
}
