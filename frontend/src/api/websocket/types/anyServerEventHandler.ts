import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"
import type { ServerEventHandler } from "@/api/websocket/types/serverEventHandler.ts"

export type AnyServerEventHandler = ServerEventHandler<keyof ServerEvents>
