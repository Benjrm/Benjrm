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
        seconds: number | null
        type: "SLIDE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ORDER"
        options: { answer: string }[]
    }
    questionResult: {
        question: string
        correctAnswer: string
        points: number
    }
    updateLeaderboard: {
        name: string
        points: number
    }[]
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
}
