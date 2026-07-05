import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"

/**
 * Permanently deletes the current user's account (`DELETE /auth/user`).
 *
 * The request body requires a hardcoded `"DELETE"` confirmation value. This
 * is not a real safeguard against accidental calls from code, just a
 * workaround to make the intent explicit in the request.
 */
async function deleteAccount(): Promise<void> {
    const res = await fetch("/auth/user", {
        body: JSON.stringify({ confirmation: "DELETE" }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete account")
}

/** Mutation to permanently delete the current user's account. */
export default function useDeleteAccount(): UseMutationResult<void, Error, void> {
    return useMutation({ mutationFn: deleteAccount })
}
