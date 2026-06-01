import type { Modifier } from "@dnd-kit/core"
import type { Question } from "@/types/quiz"
import type { QuestionApiRequest } from "@/api/questions/types/question.api"
import tempId from "@/utils/tempId"
import type { QueueItem } from "@/hooks/useQuestionChangeQueue"

export interface QuestionApiResponse {
    id: string
    question: string
    type: Question["type"]
    hidden: boolean
    options: {
        id: string
        answer?: string
        correct: boolean
    }[]
}

export function createEmptyQuestion(): Question {
    return {
        id: tempId(),
        question: "",
        options: [
            { id: tempId(), answer: "", correct: false },
            { id: tempId(), answer: "", correct: false },
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

export function responseToQuestion(response: unknown): Question {
    const resp = (response as Partial<QuestionApiResponse>) ?? {}

    const optionsRaw = Array.isArray(resp.options) ? resp.options : []

    const options = optionsRaw.map((opt) => {
        const o = opt as Record<string, unknown>
        const id = typeof o.id === "string" ? o.id : String(o.id ?? tempId())
        const answer = typeof o.answer === "string" ? o.answer : String(o.answer ?? "")
        const correct = typeof o.correct === "boolean" ? o.correct : Boolean(o.correct)
        return { id, answer, correct }
    })

    const id = typeof resp.id === "string" ? resp.id : String(resp.id ?? tempId())
    const questionText =
        typeof resp.question === "string" ? resp.question : String(resp.question ?? "")
    const type = (resp.type as Question["type"]) ?? "MULTIPLE_CHOICE"
    const hidden = typeof resp.hidden === "boolean" ? resp.hidden : Boolean(resp.hidden)

    return {
        id,
        question: questionText,
        type,
        hidden,
        options,
    }
}

export function applyQueueToQuestions(baseQuestions: Question[], queue: QueueItem[]): Question[] {
    if (queue.length === 0) return baseQuestions

    const questionsById = new Map(baseQuestions.map((question) => [question.id, question]))
    let draftQuestions = [...baseQuestions]

    const applyRequest = (question: Question, request: QuestionApiRequest): Question => {
        const nextOptions = Array.isArray(request.options)
            ? (
                  request.options as {
                      answer: string
                      correct?: boolean
                  }[]
              ).map((option, index) => ({
                  id: question.options[index]?.id ?? tempId(),
                  answer: option.answer,
                  correct: Boolean(option.correct),
              }))
            : []

        return {
            ...question,
            question: request.question,
            hidden: request.hidden,
            type: request.type,
            options: nextOptions,
        }
    }

    queue.forEach((item) => {
        if (item.op === "reorder") {
            const payload = item.payload as { order?: string[] } | undefined
            const order = payload?.order ?? []
            if (!order.length) return

            const orderSet = new Set(order)
            const orderedQuestions = order
                .map((questionId) => questionsById.get(questionId))
                .filter((question): question is Question => Boolean(question))
            const remainingQuestions = draftQuestions.filter(
                (question) => !orderSet.has(question.id)
            )

            draftQuestions = [...orderedQuestions, ...remainingQuestions]
            return
        }

        if (!item.questionId) return

        if (item.op === "delete") {
            draftQuestions = draftQuestions.filter((question) => question.id !== item.questionId)
            questionsById.delete(item.questionId)
            return
        }

        if (item.op === "create") {
            const request = item.payload as QuestionApiRequest | undefined
            if (!request) return

            const createdQuestion = applyRequest(
                {
                    id: item.questionId,
                    question: "",
                    type: request.type,
                    hidden: request.hidden,
                    options: [],
                },
                request
            )

            const existingIndex = draftQuestions.findIndex((q) => q.id === item.questionId)
            if (existingIndex >= 0) {
                draftQuestions[existingIndex] = createdQuestion
            } else {
                draftQuestions.push(createdQuestion)
            }
            questionsById.set(item.questionId, createdQuestion)
            return
        }

        if (item.op === "update") {
            const request = item.payload as Partial<QuestionApiRequest> | undefined
            if (!request) return

            const existing = questionsById.get(item.questionId)
            if (!existing) return

            const updatedQuestion = applyRequest(existing, {
                question: request.question ?? existing.question,
                hidden: request.hidden ?? existing.hidden,
                type: request.type ?? existing.type,
                options: request.options ?? existing.options,
            })

            draftQuestions = draftQuestions.map((q) =>
                q.id === item.questionId ? updatedQuestion : q
            )
            questionsById.set(item.questionId, updatedQuestion)
        }
    })

    return draftQuestions
}

export interface QuizDraftStorage {
    questions: Question[]
    currentQuestionIndex: number
    savedAt: string
}

export const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
})
