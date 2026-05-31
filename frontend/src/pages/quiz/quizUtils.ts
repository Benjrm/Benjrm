import type { Question } from "@/types/quiz"
import type { QuestionApiRequest } from "@/api/questions/types/question.api"

export function createEmptyQuestion(): Question {
    return {
        id: crypto.randomUUID(),
        question: "",
        options: [
            { id: crypto.randomUUID(), answer: "", correct: false },
            { id: crypto.randomUUID(), answer: "", correct: false },
        ],
        type: "MULTIPLE_CHOICE",
        hidden: false,
    }
}

export function questionToRequest(question: Question): QuestionApiRequest {
    return {
        question: question.question,
        type: question.type,
        hidden: question.hidden,
        options: question.options.map(({ answer, correct }) => ({ answer, correct })),
    }
}

export function responseToQuestion(response: {
    id: string
    question: string
    type: Question["type"]
    hidden: boolean
    options: { id: string; answer: string; correct: boolean }[]
}): Question {
    return {
        id: response.id,
        question: response.question,
        type: response.type,
        hidden: response.hidden,
        options: response.options.map((option) => ({ id: option.id, answer: option.answer ?? "", correct: option.correct })),
    }
}

export interface QuizDraftStorage {
    questions: Question[]
    currentQuestionIndex: number
    savedAt: string
}

import type { Modifier } from "@dnd-kit/core"
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
})
