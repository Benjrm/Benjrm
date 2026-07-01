export interface NewQuiz {
    title: string
    description?: string | null
    hidden?: boolean
}

export interface UpdateQuiz {
    title?: string
    description?: string | null
    hidden?: boolean
}

export interface QuizDto {
    id: string
    title: string
    description: string | null
    hidden: boolean
    created: string
    modified: string
}

export interface Quiz {
    id: string
    title: string
    description: string | null
    hidden: boolean
    created: Date
    modified: Date
}
