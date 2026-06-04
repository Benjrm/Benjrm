// frontend/src/api/session/hooks/useCreateSession.ts

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import sessionKeys from "../sessionKeys"
import { createSession, getSessionErrorMessage } from "@/api/session"
import type { CreateSessionInput, Session } from "@/api/session"

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
            navigate(`/quiz/waiting?code=${session.code}`)
        },
        onError: (error) => {
            toast.error(
                getSessionErrorMessage(error) ?? "The quiz session could not be started right now."
            )
        },
    })
}
