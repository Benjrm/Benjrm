/** Extracts a user-facing message from a session-related error, with a generic fallback. */
export default function getSessionErrorMessage(error: Error | null | undefined): string | null {
    if (!error) return null
    return error.message || "The quiz session could not be started right now. Please try again."
}
