import { useMemo } from "react"
import useSession from "./useSession"
import ApiError from "@/shared/types/apiError.ts"
import type { Session } from "@/features/session/types/session.ts"

/** Return value of {@link useSessionStatus}. */
interface SessionStatus {
    isLoading: boolean
    isHost: boolean
    isPlayer: boolean
    isInvalidCode: boolean
    session?: Session
}

/**
 * A hook that loads the session and determines the user's role (host or player).
 * @param code The session code
 */
export default function useSessionStatus(code: number | undefined): SessionStatus {
    const { data: session, isLoading, error: sessionError } = useSession(code)

    return useMemo(() => {
        const isHost = session?.isHost ?? false

        // If the session exists but the user is not the host, this means that the user is a player
        const isPlayer = session !== undefined && !session.isHost

        const isInvalidCode = sessionError instanceof ApiError && sessionError.status === 404

        return {
            isLoading,
            isHost,
            isPlayer,
            isInvalidCode,
            session,
        }
    }, [session, isLoading, sessionError])
}
