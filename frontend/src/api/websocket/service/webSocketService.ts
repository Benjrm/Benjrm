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

    private openCallbacks = new Set<() => void>()

    private closeWithoutOpenCallbacks = new Set<() => void>()

    private everyOpenCallbacks = new Set<() => void>()

    private everyCloseCallbacks = new Set<() => void>()

    private pendingDisconnect: ReturnType<typeof setTimeout> | null = null

    private reconnectUrl: string | null = null

    private reconnectAttempts = 0

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null

    private intentionalClose = false

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
        // Cancel any deferred disconnect so StrictMode's immediate re-mount doesn't drop the socket.
        if (this.pendingDisconnect !== null) {
            clearTimeout(this.pendingDisconnect)
            this.pendingDisconnect = null
            this.intentionalClose = false
        }

        if (
            this.socket?.url === url &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)
        ) {
            return
        }

        // Removes the onclose handler to prevent the status of the new socket from being cleared.
        // Closes the old socket only if a connection to a new one is established.
        if (this.socket) {
            this.socket.onclose = null
            this.socket.close()
        }

        this.reconnectUrl = url

        const ws = new WebSocket(url)
        this.socket = ws

        let hasOpened = false

        ws.onopen = () => {
            hasOpened = true
            this.reconnectAttempts = 0
            console.log("Connected")
            this.openCallbacks.forEach((cb) => cb())
            this.openCallbacks.clear()
            this.everyOpenCallbacks.forEach((cb) => cb())
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
                    (handler as ServerEventHandler<typeof data.command>)(
                        data.payload,
                        data.timing,
                        data.id
                    )
                )
            } catch (error) {
                console.error("Failed to process WebSocket message:", error)
            }
        }

        ws.onclose = () => {
            if (!hasOpened) {
                this.closeWithoutOpenCallbacks.forEach((cb) => cb())
                this.closeWithoutOpenCallbacks.clear()
            }
            this.cleanup(ws)
            if (hasOpened && !this.intentionalClose) {
                this.everyCloseCallbacks.forEach((cb) => cb())
                this.scheduleReconnect()
            }
            this.intentionalClose = false
        }

        ws.onerror = (error) => {
            console.error("WebSocket error:", error)
        }
    }

    /**
     * Schedules a disconnect on the next event-loop tick.
     * The pending close is cancelled if `connect` is called first (React 18 StrictMode pattern).
     * Cancels any pending auto-reconnect so the connection stays closed.
     */
    public disconnect(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        this.reconnectUrl = null
        if (!this.socket) return
        if (this.pendingDisconnect !== null) {
            clearTimeout(this.pendingDisconnect)
        }
        this.intentionalClose = true
        this.pendingDisconnect = setTimeout(() => {
            this.pendingDisconnect = null
            if (!this.socket) return
            this.socket.close()
        }, 0)
    }

    private scheduleReconnect(): void {
        if (!this.reconnectUrl || this.reconnectAttempts >= 5) return
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 16000)
        this.reconnectAttempts += 1
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/5)`)
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            if (this.reconnectUrl) this.connect(this.reconnectUrl)
        }, delay)
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
     * Registers a callback to fire once when the socket is (or becomes) open.
     * If the socket is already open the callback is invoked synchronously.
     * @returns An unsubscribe function.
     */
    public onConnect(callback: () => void): () => void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            callback()
            return () => {}
        }
        this.openCallbacks.add(callback)
        return () => {
            this.openCallbacks.delete(callback)
        }
    }

    /**
     * Registers a callback to fire once if the current socket closes before it ever opens
     * (i.e., the connection was refused or the session code was not found).
     * @returns An unsubscribe function.
     */
    public onConnectFail(callback: () => void): () => void {
        this.closeWithoutOpenCallbacks.add(callback)
        return () => {
            this.closeWithoutOpenCallbacks.delete(callback)
        }
    }

    /**
     * Registers a persistent callback that fires every time the socket opens (including the first time).
     * Fires immediately if the socket is already open.
     * @returns An unsubscribe function.
     */
    public onEveryConnect(callback: () => void): () => void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            callback()
        }
        this.everyOpenCallbacks.add(callback)
        return () => {
            this.everyOpenCallbacks.delete(callback)
        }
    }

    /**
     * Registers a persistent callback that fires every time an established connection drops unexpectedly.
     * Does not fire on intentional disconnects (via `disconnect()`).
     * @returns An unsubscribe function.
     */
    public onEveryDisconnect(callback: () => void): () => void {
        this.everyCloseCallbacks.add(callback)
        return () => {
            this.everyCloseCallbacks.delete(callback)
        }
    }

    /**
     * Dev-only: dispatches a fake server event directly to all registered listeners,
     * bypassing the real WebSocket connection. Used by mock hooks in development.
     */
    public simulateReceive<K extends keyof ServerEvents>(
        command: K,
        payload: ServerEvents[K]
    ): void {
        const handlers = this.listeners.get(command)
        handlers?.forEach((handler) =>
            (handler as ServerEventHandler<K>)(payload, undefined, undefined)
        )
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
