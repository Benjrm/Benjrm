import type { ServerEvents } from "@/features/session/websocket/types/serverEvents.ts"

/**
 * Represents a server message that can be received from the server.
 */
export type ServerMessage = {
    [K in keyof ServerEvents]: {
        id?: number
        command: K
        payload: ServerEvents[K]
        timing?: string
    }
}[keyof ServerEvents]
