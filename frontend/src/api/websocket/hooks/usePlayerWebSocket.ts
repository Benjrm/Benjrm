import useWebSocket from "@/api/websocket/hooks/useWebSocket.ts"

/**
 * Custom hook that connects to ws(s)://{host}/api/v1/sessions/{code}/ws/player and handles connection lifecycle management.
 * Only intended for session players (non-hosts).
 * @param code The session code to connect to.
 */
export default function usePlayerWebSocket(code: number | string | undefined): void {
    useWebSocket(code, "ws/player")
}
