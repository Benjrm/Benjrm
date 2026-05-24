import { createContext } from "react"

// --- TYPES ---
export interface QuestionOption {
    id: string
    text: string
}

export interface Question {
    id: string
    question: string
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
    options: QuestionOption[]
}

export interface DisplayQuestionMessage {
    command: "displayQuestion"
    payload: Question
    timing?: string
}

export interface GameSessionContextType {
    question: Question | null
    remainingTime: number | null
    selectedAnswer: string | null
    sendAnswer: (answerId: string) => void
    isConnected: boolean
}

export const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined)
