export interface Identifier {
    id: string
}

export interface ReadonlyMetadata {
    created: string
    modified: string
}

export class ApiError extends Error {
    status: number

    category: string

    error: string

    message: string

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
