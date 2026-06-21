import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"

async function deleteAccount(): Promise<void> {
    const res = await fetch("/auth/user", {
        body: JSON.stringify({ confirmation: "DELETE" }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete account")
}

export default function useDeleteAccount(): UseMutationResult<void, Error, void> {
    return useMutation({ mutationFn: deleteAccount })
}
