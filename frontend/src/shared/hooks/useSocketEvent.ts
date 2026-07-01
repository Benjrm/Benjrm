import { useEffect, useRef } from "react"
import type { ServerEvents } from "@/shared/types/serverEvents.ts"
import type { ServerEventHandler } from "@/shared/types/serverEventHandler.ts"
import useWebSocketContext from "@/shared/hooks/useWebSocketContext.ts"

/**
 * Custom hook to subscribe to a WebSocket event. It takes a command and a handler function as arguments.
 * The handler will be called whenever the specified command is received from the server.
 * @param command The command to subscribe to.
 * @param handler The handler function to call when the command is received. It receives the payload, timing and id as arguments.
 * @example useSocketEvent("addPlayer", (payload, timing) => { const name = payload.name })
 */
export default function useSocketEvent<K extends keyof ServerEvents>(
    command: K,
    handler: ServerEventHandler<K>
): void {
    const websocketService = useWebSocketContext()

    const handlerRef = useRef(handler)
    useEffect(() => {
        handlerRef.current = handler
    }, [handler])

    useEffect(
        () =>
            websocketService.subscribe(command, (payload, timing, id) => {
                handlerRef.current(payload, timing, id)
            }),
        [command, websocketService]
    )
}
