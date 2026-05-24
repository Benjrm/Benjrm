export interface ServerEvents {
    displayQuestion: {
        id: string
        question: string
        type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
        options: object
    }
    questionResult: {
        question: string
        correctAnswer: string
        points: number
    }
    updateLeaderboard: {
        name: string
        points: number
    }
    addParticipant: {
        id: string
        name: string
    }
    removeParticipant: {
        id: string
        name: string
    }
}
