import { useEffect, useState } from "react"
import type WebSocketService from "../service/webSocketService"
import { getSession } from "@/api/session"
import { ApiError } from "@/api/utils"

interface Error {
    isReconnecting: boolean
    isInvalidCode: boolean
    unableToConnect: boolean
}

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
