export interface Identifier {
    id: string
}

export interface ReadonlyMetadata {
    created: string
    modified: string
}

export class ApiError extends Error {
    category: string

    error: string

    message: string

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    constructor(error: any) {
        if (
            typeof error.category === "string" &&
            typeof error.error === "string" &&
            typeof error.message === "string"
        ) {
            super(error.message)
            this.category = error.category
            this.error = error.error
            this.message = error.message
        } else {
            throw error
        }
    }
}
