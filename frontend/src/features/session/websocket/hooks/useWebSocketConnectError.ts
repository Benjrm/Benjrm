import { useEffect, useState } from "react"
import type WebSocketService from "@/features/session/websocket/utils/webSocketService.ts"
import ApiError from "@/shared/types/apiError.ts"
import getSession from "@/features/session/api/getSession.ts"

/** Connection-health state surfaced to game-session views, e.g. to show a reconnect overlay. */
interface Error {
    /** Whether the socket is currently disconnected and attempting to reconnect. */
    isReconnecting: boolean
    /** Whether the session `code` was confirmed invalid (404) after a failed connection attempt. */
    isInvalidCode: boolean
    /** Whether reconnection attempts have been exhausted without an invalid code being the cause. */
    unableToConnect: boolean
}

/**
 * Derives user-facing connection error state from a {@link WebSocketService}'s
 * lifecycle events. On a failed initial connection, double-checks the
 * session code against the REST API to distinguish "session doesn't exist"
 * from "temporarily unreachable".
 *
 * @param ws - The websocket service instance to observe.
 * @param code - Session code, used to verify validity on a failed connection attempt.
 */
export default function useWebSocketConnectError(ws: WebSocketService, code?: number): Error {
    // Start as true so the overlay shows until the WS is confirmed open.
    // onEveryConnect fires immediately if the socket is already open (normal navigation),
    // so there is no visible flash on non-refresh transitions.
    const [isReconnecting, setIsReconnecting] = useState(true)
    const [isInvalidCode, setIsInvalidCode] = useState(false)
    const [unableToConnect, setUnableToConnect] = useState(false)

    useEffect(() => {
        const unsubDisconnect = ws.onEveryDisconnect(() => setIsReconnecting(true))
        const unsubConnect = ws.onEveryConnect(() => setIsReconnecting(false))
        const unsubConnectFail = ws.onConnectFail(async () => {
            if (code) {
                try {
                    await getSession(code)
                } catch (e) {
                    if (e instanceof ApiError && e.status === 404) {
                        setIsInvalidCode(true)
                    }
                }
            }
        })
        const unsubReconnectFail = ws.onReconnectFail(() => setUnableToConnect(true))
        return () => {
            unsubDisconnect()
            unsubConnect()
            unsubConnectFail()
            unsubReconnectFail()
        }
    }, [ws, code])

    return {
        isReconnecting,
        isInvalidCode,
        unableToConnect: unableToConnect && !isInvalidCode,
    }
}
