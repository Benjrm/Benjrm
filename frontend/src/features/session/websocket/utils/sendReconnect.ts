import type { ServerMessage } from "../types/serverMessage"
import type WebSocketService from "@/features/session/websocket/utils/webSocketService.ts"

/**
 * Reads stored reconnect credentials from sessionStorage and, if present, sends a `reconnect`
 * command over the WebSocket.
 *
 * Tracks the server response: if the server replies with an error (e.g. PlayerNotFound due to
 * stale data from a previous session), the `id` and `secret` are removed from sessionStorage so
 * the player can join fresh via `setName` instead.
 */
export default async function sendReconnect(
    ws: WebSocketService,
    storageKey: string,
    response: (response: ServerMessage) => void
): Promise<void> {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return

    let saved: { id?: string; secret?: string }
    try {
        saved = JSON.parse(raw) as { id?: string; secret?: string }
    } catch {
        return
    }

    if (!saved.id || !saved.secret) return

    const reconnect = await ws.send({
        command: "reconnect",
        payload: { id: saved.id, secret: saved.secret },
    })

    const err = reconnect.getError()
    if (
        err?.category === "session" &&
        (err.error === "invalid_player_secret" || err.error === "player_not_found")
    ) {
        sessionStorage.removeItem(storageKey)
    }

    response(reconnect)
}
