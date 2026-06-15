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
    start: object
    displayQuestion: {
        id: string
        question: string
        type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ORDER" | "SLIDE"
        options: { id: string; answer: string }[]
        seconds: number | null
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
}
