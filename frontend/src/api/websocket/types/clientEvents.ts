/**
 * Maps client commands to their respective payload types.
 * Each key represents a command sent by the server, and its value defines the structure of the data payload associated with that command.
 */
export interface ClientEvents {
    pong: {
        id: number,
        timestamp: string
    }
    join: {
        name: string
    }
    answerQuestion: {
        answers: string[]
    }
    start: object
    showQuestion: {
        question: string
    }
    setQuiz: {
        quiz: string
    }
}
