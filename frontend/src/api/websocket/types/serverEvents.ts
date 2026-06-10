/**
 * Maps server commands to their respective payload types.
 * Each key represents a command sent by the server, and its value defines the structure of the data payload associated with that command.
 */
export interface ServerEvents {
    ping: {
        id: number
    }
    displayQuestion: {
        id: string
        question: string
        type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
        options: unknown
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
    addParticipant: {
        id: string
        name: string
    }
    removeParticipant: {
        id: string
        name: string
    }
}
