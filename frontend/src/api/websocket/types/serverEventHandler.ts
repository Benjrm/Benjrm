import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"

/**
 * A type for a function that handles server events. It takes a payload of the event and a timing string as arguments.
 * @template K - The type of the server event, which must be a key of the ServerEvents type.
 * @param payload - The payload of the server event, which is of the type corresponding to the event key in ServerEvents.
 * @param elapsedMs - Milliseconds elapsed since the server fired this event (accounts for network latency)
 * @returns void
 */
export type ServerEventHandler<K extends keyof ServerEvents> = (
    payload: ServerEvents[K],
    elapsedMs: number,
    id?: number
) => void
