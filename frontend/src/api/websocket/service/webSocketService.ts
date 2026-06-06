import { toast } from "sonner"
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

    private cleanup(): void {
        toast("Disconnected")
        this.socket = null
        this.listeners.clear()
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

        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
            toast("Connected")
        }

        this.socket.onmessage = async (event) => {
            try {
                const message = await WebSocketService.decodeMessageData(event.data)
                if (message === null) {
                    toast("Received unsupported WebSocket message type")
                    return
                }
                const raw = JSON.parse(message)
                if (
                    typeof raw !== "object" ||
                    raw === null ||
                    !("command" in raw) ||
                    typeof raw.command !== "string"
                ) {
                    toast("Received invalid WebSocket message")
                }
                const data = raw as ServerMessage
                const handlers = this.listeners.get(data.command)
                handlers?.forEach((handler) =>
                    (handler as ServerEventHandler<typeof data.command>)(data.payload, data.timing)
                )
            } catch (error) {
                toast(
                    error instanceof Error
                        ? `Failed to process WebSocket message: ${error.message}`
                        : "Failed to process WebSocket message"
                )
            }
        }

        this.socket.onclose = () => {
            this.cleanup()
        }

        this.socket.onerror = () => {
            toast("WebSocket error")
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
     * Directly dispatches a fake server message to all registered handlers for the given command.
     * Useful for development mocks and testing without a real WebSocket connection.
     * @param command The server command to simulate.
     * @param payload The payload to pass to the handlers.
     * @param timing An ISO timestamp string; defaults to now.
     */
    public simulateReceive<K extends keyof ServerEvents>(
        command: K,
        payload: ServerEvents[K],
        timing = new Date().toISOString()
    ): void {
        const handlers = this.listeners.get(command)
        handlers?.forEach((handler) => (handler as ServerEventHandler<K>)(payload, timing))
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
