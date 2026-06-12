import type { Modifier } from "@dnd-kit/core"
import type { Question } from "@/types/question"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api"
import tempId from "@/utils/tempId"
import { QueueOpEnum } from "@/hooks/useQuestionChangeQueue"
import type { QueueItem } from "@/hooks/useQuestionChangeQueue"
import { QuestionTypeEnum } from "@/api/questions/types/questionType"
import type { QuestionRequest, QuestionType } from "@/api/questions/types/question.api.new.ts"

export function getQuestionPreviewText(text: string | undefined, type?: QuestionType): string {
    const firstLine =
        text
            ?.split("\n")
            .map((l) => l.trim())
            .find((l) => l.length > 0) ?? ""
    const cleaned = firstLine
        .replace(/^#+\s*/, "")
        .replace(/[*_~`]/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .trim()
    return cleaned || (type === "SLIDE" ? "Untitled slide" : "Untitled question")
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

export function questionToRequest(question: Question): QuestionRequest {
    const getOptions = () => {
        if (question.type === "SLIDE") return []
        if (question.type === "ORDER")
            return question.options.map((opt) => ({ answer: opt.answer }))
        return question.options.map((opt) => ({
            answer: opt.answer,
            correct: Boolean((opt as { correct?: boolean }).correct),
        }))
    }

    return {
        question: question.question,
        type: question.type,
        hidden: question.hidden,
        options: getOptions(),
    }
}

export function responseToQuestion(response: QuestionApiResponse): Question {
    const optionsRaw = Array.isArray(response.options) ? response.options : []

    const options = optionsRaw.map((opt) => ({
        id: String(opt.id ?? tempId()),
        answer: String(opt.answer ?? ""),
        correct: Boolean((opt as { correct?: boolean }).correct),
    }))

    return {
        id: String(response.id ?? tempId()),
        question: String(response.question ?? ""),
        type: response.type ?? QuestionTypeEnum.MULTIPLE_CHOICE,
        hidden: Boolean(response.hidden),
        options,
    }
}

export function applyQueueToQuestions(baseQuestions: Question[], queue: QueueItem[]): Question[] {
    if (queue.length === 0) return baseQuestions

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
        if (item.op === QueueOpEnum.REORDER) {
            const payload = item.payload as { order?: string[] } | undefined
            const order = payload?.order ?? []
            if (!order.length) return

            const orderSet = new Set(order)
            const orderedQuestions = order
                .map((questionId) => draftQuestions.find((q) => q.id === questionId))
                .filter((question): question is Question => Boolean(question))
            const remainingQuestions = draftQuestions.filter(
                (question) => !orderSet.has(question.id)
            )

            draftQuestions = [...orderedQuestions, ...remainingQuestions]
            return
        }

        if (!item.questionId) return

        if (item.op === QueueOpEnum.DELETE) {
            draftQuestions = draftQuestions.filter((question) => question.id !== item.questionId)
            return
        }

        if (item.op === QueueOpEnum.CREATE) {
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
            return
        }

        if (item.op === QueueOpEnum.UPDATE) {
            const request = item.payload as Partial<QuestionApiRequest> | undefined
            if (!request) return

            const existing = draftQuestions.find((q) => q.id === item.questionId)
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
        }
    })

    return draftQuestions
}



export const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
})

export const restrictToParentElement: Modifier = ({
    containerNodeRect,
    draggingNodeRect,
    transform,
}) => {
    if (!draggingNodeRect || !containerNodeRect) return transform

    return {
        ...transform,
        x: Math.min(
            Math.max(transform.x, containerNodeRect.left - draggingNodeRect.left),
            containerNodeRect.right - draggingNodeRect.right
        ),
        y: Math.min(
            Math.max(transform.y, containerNodeRect.top - draggingNodeRect.top),
            containerNodeRect.bottom - draggingNodeRect.bottom
        ),
    }
}
