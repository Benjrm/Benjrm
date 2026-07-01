// frontend/src/api/websocket/hooks/useHostWebSocket.ts

import useWebSocket from "@/shared/hooks/useWebSocket.ts"

/**
 * Custom hook that connects to ws(s)://{host}/api/v1/sessions/{code}/ws/host and handles connection lifecycle management.
 * Only intended for the session host.
 * @param code The session code to connect to.
 */
export default function useHostWebSocket(code: number | string | undefined): void {
    useWebSocket(code, "ws/host")
}
