import type { QuestionType } from "@/api/questions/questions.types.ts"
import type { QuestionStatistics } from "@/hooks/useQuestionStatistics"

/**
 * Maps server commands to their respective payload types.
 * Each key represents a command sent by the server, and its value defines the structure of the data payload associated with that command.
 */
export interface ServerEvents {
    error: {
        category: string
        error: string
        message: string
    }
    ok: unknown
    ping: {
        id: number
    }
    displayQuestion: {
        id: string
        question: string
        type: QuestionType
        options: { id: string; answer: string }[]
        seconds: number | null
        index: number
        totalQuestions: number
    }
    questionResult: {
        question: string
        correctAnswers: string[]
        totalPoints: number
        points: number
    }
    displayLeaderboard: {
        leaderboard: {
            id: string
            name: string
            emoji: string | null
            totalPoints: number
            points: number
        }[]
        isFinal: boolean
    }
    showStatistics: QuestionStatistics
    displayPodium: unknown
    addPlayer: {
        id: string
        name: string
        emoji: string | null
    }
    renamePlayer: {
        id: string
        name: string
        emoji: string | null
    }
    removePlayer: {
        id: string
    }
    kick: unknown
    start: unknown
    gameEnded: unknown
    connectResponse: {
        id: string
        secret: string
        name: string
        emoji: string | null
    }
}
