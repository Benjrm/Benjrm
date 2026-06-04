// frontend/src/types/quiz.ts

export interface Question {
    id: number
    title: string
    type: "Multiple Choice" | "True/False"
    options: string[]
}

export interface LeaderboardEntry {
    id: string
    name: string
    points: number
    avatar?: string
}

export interface Answer {
    id: string
    text: string
    color: string
    icon: string
}
