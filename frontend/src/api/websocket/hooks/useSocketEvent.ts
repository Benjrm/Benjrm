import { useEffect } from "react"
import { websocketService } from "@/api/websocket/service/websocketService.ts"
import type { ServerEvents } from "@/api/websocket/types/serverEvents.ts"
import type { ServerEventHandler } from "@/api/websocket/types/serverEventHandler.ts"

export default function useSocketEvent<K extends keyof ServerEvents>(
    command: K,
    handler: ServerEventHandler<K>
): void {
    useEffect(() => websocketService.subscribe(command, handler), [command, handler])
}
