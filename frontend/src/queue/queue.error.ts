import type { ApiError } from "@/api/utils.ts"

export default class QuestionQueueError extends Error {
    question: string | undefined

    error: Error | ApiError

    constructor(question: string | undefined, error: Error | ApiError) {
        super(error.message)
        this.question = question
        this.error = error
    }
}
