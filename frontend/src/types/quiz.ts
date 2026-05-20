// frontend/src/types/quiz.ts

export interface Question {
    id: number
    title: string
    type: "Multiple Choice" | "True/False"
    options: string[]
}
