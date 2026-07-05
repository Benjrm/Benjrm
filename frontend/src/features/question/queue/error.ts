import type ApiError from "@/shared/types/apiError.ts"

/**
 * Error raised when processing a single `QueueItem` fails, wrapping the
 * underlying cause together with the id of the question it was operating on
 * (if any), so failures can be attributed to a specific question in the UI.
 */
export default class QuestionQueueError extends Error {
    /** Id of the question the failed operation targeted, if applicable. */
    question: string | undefined

    /** Underlying error that caused the operation to fail. */
    error: Error | ApiError

    constructor(question: string | undefined, error: Error | ApiError) {
        super(error.message)
        this.question = question
        this.error = error
    }
}
