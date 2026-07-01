import { useEffect } from "react"
import useWebSocket from "@/shared/hooks/useWebSocket.ts"
import useWebSocketContext from "@/shared/hooks/useWebSocketContext.ts"
import sendReconnect from "@/shared/utils/sendReconnect.ts"

/**
 * Custom hook that connects to ws(s)://{host}/api/v1/sessions/{code}/ws/player and handles connection lifecycle management.
 * On every successful (re)connect, attempts to reconnect with stored credentials if available.
 * Only intended for session players (non-hosts).
 * @param code The session code to connect to.
 */
export default function usePlayerWebSocket(
    code: number | string | undefined,
    setNameSaved: (value: boolean) => void
): void {
    useWebSocket(code, "ws/player")
    const ws = useWebSocketContext()

    useEffect(() => {
        if (!code) return undefined
        const storageKey = `waitingRoom:${code}`
        return ws.onEveryConnect(() => sendReconnect(ws, storageKey, setNameSaved))
    }, [code, ws, setNameSaved])
}
