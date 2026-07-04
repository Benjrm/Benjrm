/**
 * Error thrown by `apiClient` for any non-ok HTTP response.
 *
 * Wraps the backend's structured error body (`category`/`error`/`message`, see
 * the Rust `ErrorResponse` type) so callers can branch on `status`/`category`
 * instead of parsing the response again.
 */
class ApiError extends Error {
    /** HTTP status code of the response. */
    status: number

    /** Broad error category as reported by the backend (e.g. "validation"). */
    category: string

    /** Specific error identifier as reported by the backend. */
    error: string

    /** Human-readable error message, also used as the `Error.message`. */
    message: string

    /**
     * @param status - HTTP status code of the response.
     * @param error - Either a plain string message, or the backend's structured
     * error body. A structured body missing any of its fields is treated as invalid.
     */
    constructor(
        status: number,
        error: string | { category?: string; error?: string; message?: string }
    ) {
        if (typeof error === "string") {
            super(error)
            this.status = status
            this.category = "unknown"
            this.error = "unknown"
            this.message = error
        } else if (
            typeof error.category === "string" &&
            typeof error.error === "string" &&
            typeof error.message === "string"
        ) {
            super(error.message)
            this.status = status
            this.category = error.category
            this.error = error.error
            this.message = error.message
        } else {
            throw new Error(String(error))
        }
    }
}
export default ApiError
