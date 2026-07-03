import type ApiError from "@/shared/types/apiError.ts"

export default class QuestionQueueError extends Error {
    question: string | undefined

    error: Error | ApiError

    constructor(question: string | undefined, error: Error | ApiError) {
        super(error.message)
        this.question = question
        this.error = error
    }
}
