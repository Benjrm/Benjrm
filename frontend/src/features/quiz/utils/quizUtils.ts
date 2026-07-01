import type { Modifier } from "@dnd-kit/core"
import type { TFunction } from "i18next"
import tempId from "@/shared/utils/tempId"
import type {
    Question,
    QuestionRequest,
    QuestionType,
    UpdateQuestionRequest,
} from "@/features/question/types/questions.types.ts"
import type { QueueItem } from "@/features/question/queue/queue.types.ts"
import assertNever from "@/shared/utils/assertNever.ts"

export function getQuestionPreviewText(
    text: string | undefined,
    type?: QuestionType,
    t?: TFunction
): string {
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

    if (t) {
        return (
            cleaned ||
            (type === "SLIDE"
                ? t("quizEditor.editor.untitledSlide")
                : t("quizEditor.editor.untitledQuestion"))
        )
    }
    return cleaned || (type === "SLIDE" ? "Untitled slide" : "Untitled question")
}

export function createEmptyQuestion(): Question {
    return {
        id: tempId(),
        question: "",
        created: new Date(),
        modified: new Date(),
        type: "SINGLE_CHOICE",
        options: [
            { id: tempId(), answer: "", correct: false },
            { id: tempId(), answer: "", correct: false },
        ],
        hidden: false,
    }
}

export function applyQueueToQuestions(baseQuestions: Question[], queue: QueueItem[]): Question[] {
    if (queue.length === 0) return baseQuestions

    let draftQuestions = [...baseQuestions]

    const applyRequest = (
        question: Question,
        request: QuestionRequest | UpdateQuestionRequest
    ): Question => {
        switch (request.type) {
            case "SLIDE":
                return {
                    ...question,
                    question: request.question,
                    hidden: request.hidden,
                    type: request.type,
                }
            case "ORDER": {
                const existingOptions = question.type === "ORDER" ? question.options : []
                return {
                    ...question,
                    question: request.question,
                    hidden: request.hidden,
                    type: "ORDER",
                    options: request.options.map((o, i) => ({
                        id: existingOptions[i]?.id ?? tempId(),
                        answer: o.answer,
                    })),
                }
            }
            case "SINGLE_CHOICE":
            case "MULTIPLE_CHOICE": {
                const existingOptions =
                    question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE"
                        ? question.options
                        : []
                return {
                    ...question,
                    question: request.question,
                    hidden: request.hidden,
                    type: request.type,
                    options: request.options.map((o, i) => ({
                        id: existingOptions[i]?.id ?? tempId(),
                        answer: o.answer,
                        correct: o.correct,
                    })),
                }
            }
            default:
                return assertNever(request)
        }
    }

    queue.forEach((item) => {
        if (item.op === "reorder") {
            const { order } = item.payload
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

        if (item.op === "delete") {
            draftQuestions = draftQuestions.filter((question) => question.id !== item.questionId)
            return
        }

        if (item.op === "create") {
            const request = item.payload as QuestionRequest | undefined
            if (!request) return

            const now = new Date()
            const base = {
                id: item.questionId,
                question: "",
                type: request.type,
                hidden: request.hidden,
                created: now,
                modified: now,
            }

            const createdQuestion =
                request.type === "SLIDE"
                    ? applyRequest(
                          {
                              ...base,
                              type: "SLIDE",
                          },
                          request
                      )
                    : applyRequest(
                          {
                              ...base,
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

        if (item.op === "update") {
            const request = item.payload as QuestionRequest | undefined
            if (!request) return
            if (!request.type) return

            const existing = draftQuestions.find((q) => q.id === item.questionId)
            if (!existing) return

            const base = {
                question: request.question ?? existing.question,
                type: request.type ?? existing.type,
                hidden: request.hidden ?? existing.hidden,
                modified: new Date(),
            }

            let updatedQuestion: Question
            switch (request.type) {
                case "SLIDE":
                    updatedQuestion = applyRequest(existing, {
                        ...base,
                        type: "SLIDE",
                    })
                    break
                case "ORDER":
                    updatedQuestion = applyRequest(existing, {
                        ...base,
                        type: request.type,
                        options: request.options,
                    })
                    break
                case "SINGLE_CHOICE":
                case "MULTIPLE_CHOICE":
                    updatedQuestion = applyRequest(existing, {
                        ...base,
                        type: request.type,
                        options: request.options,
                    })
                    break
                default:
                    assertNever(request)
            }

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
