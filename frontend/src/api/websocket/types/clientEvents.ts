export interface ClientEvents {
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
