import type { ServerEvents } from "@/shared/types/serverEvents.ts"
import type { ServerEventHandler } from "@/shared/types/serverEventHandler.ts"

/**
 * Utility type that represents a handler function for any server event.
 * It is defined as a union of ServerEventHandler types for all keys in the ServerEvents type,
 * allowing it to handle any event defined in ServerEvents.
 */
export type AnyServerEventHandler = ServerEventHandler<keyof ServerEvents>
