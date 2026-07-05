/** Request payload to create a new quiz. */
export interface NewQuiz {
    title: string
    description?: string | null
    hidden?: boolean
}

/** Request payload to partially update an existing quiz. */
export interface UpdateQuiz {
    title?: string
    description?: string | null
    hidden?: boolean
}

/** Quiz API response shape, with timestamps as ISO strings. */
export interface QuizDto {
    id: string
    title: string
    description: string | null
    hidden: boolean
    created: string
    modified: string
}

/** Quiz domain model used within the frontend application (see `toQuiz`). */
export interface Quiz {
    id: string
    title: string
    description: string | null
    hidden: boolean
    created: Date
    modified: Date
}
