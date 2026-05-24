import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"

/**
 * Represents a server message that can be received from the server.
 */
export type ServerMessage = {
    [K in keyof ServerEvents]: {
        command: K
        payload: ServerEvents[K]
        timing: Date
    }
}[keyof ServerEvents]
