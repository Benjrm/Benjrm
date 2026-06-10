import { useMemo } from "react"
import useSession from "./useSession"
import type { Session } from "@/api/session"
import { ApiError } from "@/api/utils"

export interface SessionStatus {
    isLoading: boolean
    isHost: boolean
    isParticipant: boolean
    isInvalidCode: boolean
    session: Session | undefined
}

/**
 * A hook that loads the session and determines the user's role (host or participant).
 * @param code The session code
 */
export default function useSessionStatus(code: number | undefined): SessionStatus {
    const { data: session, isLoading, error: sessionError } = useSession(code)

    return useMemo(() => {
        // If we have session data, the user is the host
        const isHost = !!session

        // A 403 error indirectly indicates that the user is a participant
        const isParticipant = sessionError instanceof ApiError && sessionError.status === 403

        const isInvalidCode = !!sessionError && !isParticipant

        return {
            isLoading,
            isHost,
            isParticipant,
            isInvalidCode,
            session,
        }
    }, [session, isLoading, sessionError])
}
