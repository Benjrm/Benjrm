import type { ServerEvents } from "@/features/session/websocket/types/serverEvents.ts"

/**
 * Represents a server message that can be received from the server.
 */
export type InnerServerMessage = {
    [K in keyof ServerEvents]: {
        id?: number
        command: K
        payload: ServerEvents[K]
        timing?: string
    }
}[keyof ServerEvents]

export class ServerMessage {
    public message: InnerServerMessage

    constructor(message: InnerServerMessage) {
        this.message = message
    }

    public ok(): boolean {
        return this.message.command !== "error"
    }

    public getError(): ServerEvents["error"] | null {
        if (this.ok()) return null
        return this.message.payload as ServerEvents["error"]
    }

    public getPayload<K extends keyof ServerEvents>(command: K): ServerEvents[K] | null {
        if (command === this.message.command) {
            return this.message.payload as ServerEvents[K]
        }

        return null
    }
}
