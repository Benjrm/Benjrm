import type { ClientMessage } from "@/api/websocket/types/clientMessage.ts"
import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"
import type { AnyServerEventHandler } from "@/api/websocket/types/anyServerEventHandler.ts"
import type { ServerEventHandler } from "@/api/websocket/types/serverEventHandler.ts"
import type { ServerMessage } from "@/api/websocket/types/serverMessage.ts"

export class WebsocketService {
    private socket: WebSocket | null = null

    private listeners = new Map<keyof ServerEvents, Set<AnyServerEventHandler>>()

    public connect(url: string): void {
        this.socket = new WebSocket(url)
        this.socket.onopen = () => {
            console.log("Connected")
        }
        this.socket.onmessage = (event) => {
            const raw = JSON.parse(event.data)
            const data = raw as ServerMessage
            const handlers = this.listeners.get(data.command)
            handlers?.forEach((handler) =>
                (handler as ServerEventHandler<typeof data.command>)(data.payload, data.timing)
            )
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
        if (!this.socket) return
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
