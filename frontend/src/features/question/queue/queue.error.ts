import type { ApiError } from "@/shared/utils/apiUtils.ts"

export default class QuestionQueueError extends Error {
    question: string | undefined

    error: Error | ApiError

    constructor(question: string | undefined, error: Error | ApiError) {
        super(error.message)
        this.question = question
        this.error = error
    }
}
