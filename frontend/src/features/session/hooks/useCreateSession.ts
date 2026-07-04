import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import sessionKeys from "@/features/session/utils/sessionKeys"
import type { CreateSessionInput, Session } from "@/features/session/types/session.ts"
import createSession from "@/features/session/api/createSession.ts"
import getSessionErrorMessage from "@/features/session/utils/getSessionErrorMessage.ts"

/**
 * Hook to create a session.
 * @returns The mutation result.
 */
export default function useCreateSession(): UseMutationResult<Session, Error, CreateSessionInput> {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: createSession,
        onSuccess: (session) => {
            queryClient.setQueryData(sessionKeys.detail(session.code), session)
            toast.success("Quiz session started successfully!")
            const code = String(session.code).padStart(8, "0")
            navigate(`/play/${code}/host`)
        },
        onError: (error) => {
            toast.error(
                getSessionErrorMessage(error) ?? "The quiz session could not be started right now."
            )
        },
    })
}
