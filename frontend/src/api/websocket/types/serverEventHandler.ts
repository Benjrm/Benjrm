import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"

export type ServerEventHandler<K extends keyof ServerEvents> = (
    payload: ServerEvents[K],
    timing: Date
) => void
