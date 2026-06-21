/**
 * Maps client commands to their respective payload types.
 * Each key represents a command sent by the server, and its value defines the structure of the data payload associated with that command.
 */
export interface ClientEvents {
    pong: {
        id: number
        timestamp: string
    }
    setName: {
        name: string
        emoji: string | null
    }
    answerQuestion: {
        answer: string[]
    }
    start: object
    nextQuestion: object
    showQuestion: {
        id: string
    }
    setQuiz: {
        quiz: string
    }
    kickPlayer: {
        id: string
    }
    endGame: object
}
