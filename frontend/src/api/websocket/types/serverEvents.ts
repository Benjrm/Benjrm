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
        type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
        options: object
        secondsToAnswer: number
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
    kick: unknown
}
