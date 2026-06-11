import type { ClientEvents } from "@/api/websocket/types/clientEvents.ts"

/**
 * Represents a client message that can be sent to the server.
 */
export type ClientMessage = {
    [K in keyof ClientEvents]: {
        id?: number
        command: K
        payload?: ClientEvents[K]
    }
}[keyof ClientEvents]
