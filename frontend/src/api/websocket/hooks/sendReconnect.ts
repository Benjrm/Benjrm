import type WebSocketService from "@/api/websocket/service/webSocketService.ts"

/**
 * Reads stored reconnect credentials from sessionStorage and, if present, sends a `reconnect`
 * command over the WebSocket.
 *
 * Tracks the server response: if the server replies with an error (e.g. PlayerNotFound due to
 * stale data from a previous session), the `id` and `secret` are removed from sessionStorage so
 * the player can join fresh via `setName` instead.
 */
export default function sendReconnect(
    ws: WebSocketService,
    storageKey: string,
    setNameSaved: (value: boolean) => void
): void {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return

    let saved: { id?: string; secret?: string }
    try {
        saved = JSON.parse(raw) as { id?: string; secret?: string }
    } catch {
        return
    }

    if (!saved.id || !saved.secret) return

    const arr = new Uint32Array(1)
    crypto.getRandomValues(arr)
    const cmdId = arr[0]
    let resolved = false

    let unsubOk: () => void = () => {}
    let unsubErr: () => void = () => {}

    unsubOk = ws.subscribe("ok", (_payload, _timing, id) => {
        if (id !== cmdId || resolved) return
        resolved = true
        unsubOk()
        unsubErr()
        setNameSaved(true)
    })

    unsubErr = ws.subscribe("error", (_payload, _timing, id) => {
        if (id !== cmdId || resolved) return
        resolved = true
        unsubOk()
        unsubErr()
        setNameSaved(false)
        try {
            const current = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}")
            delete current.id
            delete current.secret
            delete current.nameSaved
            sessionStorage.setItem(storageKey, JSON.stringify(current))
        } catch {
            // ignore
        }
    })

    ws.send({ id: cmdId, command: "reconnect", payload: { id: saved.id, secret: saved.secret } })
}
