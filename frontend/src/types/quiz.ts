// frontend/src/types/quiz.ts

export interface Question {
    id: string
    title: string
    type: "Multiple Choice" | "True/False"
    options: string[]
}
