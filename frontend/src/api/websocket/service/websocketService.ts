import type { ClientMessage } from "@/api/websocket/types/clientMessage.ts"
import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"
import type { AnyServerEventHandler } from "@/api/websocket/types/anyServerEventHandler.ts"
import type { ServerEventHandler } from "@/api/websocket/types/serverEventHandler.ts"
import type { ServerMessage } from "@/api/websocket/types/serverMessage.ts"

export class WebsocketService {
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

    public connect(url: string): void {
        if (this.socket?.url === url && this.socket.readyState === WebSocket.OPEN) {
            return
        }

        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
            console.log("Connected")
        }

        this.socket.onmessage = async (event) => {
            try {
                const message = await WebsocketService.decodeMessageData(event.data)
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

        this.socket.onclose = () => {
            this.disconnect()
        }

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error)
        }
    }

    public disconnect(): void {
        console.log("Disconnected")
        this.socket?.close()
        this.listeners.clear()
        this.socket = null
    }

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

export const websocketService = new WebsocketService()
