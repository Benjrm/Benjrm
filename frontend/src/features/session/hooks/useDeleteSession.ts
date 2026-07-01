// frontend/src/api/session/hooks/useDeleteSession.ts

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import sessionKeys from "@/features/session/utils/sessionKeys"
import { deleteSession, getSessionErrorMessage } from "@/features/session/api/session"

/**
 * Hook to delete a session.
 * @returns The mutation result.
 */
export default function useDeleteSession(): UseMutationResult<void, Error, number> {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: deleteSession,
        onSuccess: (_, code) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(code) })
            toast.success("Session closed successfully.")
            navigate("/dashboard")
        },
        onError: (error) => {
            toast.error(
                getSessionErrorMessage(error) ?? "The session could not be closed right now."
            )
        },
    })
}
