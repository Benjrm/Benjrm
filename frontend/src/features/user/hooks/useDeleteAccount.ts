import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"

/**
 * Permanently deletes the current user's account (`DELETE /auth/user`),
 * requiring an explicit `"DELETE"` confirmation in the body as a safeguard
 * against accidental calls.
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
