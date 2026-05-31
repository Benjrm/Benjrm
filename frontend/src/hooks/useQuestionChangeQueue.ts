import { useCallback, useEffect, useReducer, useState } from "react"
import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl"
import type { QuestionApiRequest } from "@/api/questions/types/question.api.ts"
import useQuestionQueueStorage from "@/api/questions/hooks/useQuestionQueueStorage.ts"

export type QueueOp = "create" | "update" | "delete" | "reorder"

export interface QueueItem {
    id: string
    op: QueueOp
    quizId: string
    questionId?: string
    payload?: unknown
    createdAt: string
}

type Action =
    | { type: "enqueue"; item: QueueItem }
    | { type: "clear" }
    | { type: "replace"; items: QueueItem[] }
    | { type: "upsertReorder"; order: string[]; quizId?: string }
    | { type: "upsertUpdate"; questionId: string; payload: Partial<QuestionApiRequest>; quizId?: string }

function reducer(state: QueueItem[], action: Action): QueueItem[] {
    switch (action.type) {
        case "enqueue":
            return [...state, action.item]
        case "clear":
            return []
        case "replace":
            return action.items
        case "upsertReorder":
            // remove existing reorder items and append the latest
            return [
                ...state.filter((i) => i.op !== "reorder"),
                {
                    id: `reorder-${Date.now()}`,
                    op: "reorder",
                    quizId: action.quizId ?? "",
                    payload: { order: action.order },
                    createdAt: new Date().toISOString(),
                } as QueueItem,
            ]
        case "upsertUpdate":
            // remove existing update items for this question and append latest
            return [
                ...state.filter((i) => !(i.op === "update" && i.questionId === action.questionId)),
                {
                    id: `update-${action.questionId}-${Date.now()}`,
                    op: "update",
                    quizId: action.quizId ?? "",
                    questionId: action.questionId,
                    payload: action.payload,
                    createdAt: new Date().toISOString(),
                } as QueueItem,
            ]
        default:
            return state
    }
}

export interface UseQuestionChangeQueueReturn {
    enqueue: (item: QueueItem) => void
    clear: () => void
    flush: () => Promise<{ items: QueueItem[]; idMap: Record<string, string> }>
    upsertReorder: (order: string[]) => void
    upsertUpdate: (questionId: string, payload: Partial<QuestionApiRequest>) => void
    pendingCount: number
    isFlushing: boolean
    lastError: Error | null
    queue: QueueItem[]
}

export default function useQuestionChangeQueue(quizId?: string): UseQuestionChangeQueueReturn {
    const queueStorage = useQuestionQueueStorage()
    const storageQuizId = quizId ?? "new"
    const [queue, dispatch] = useReducer(reducer, [] as QueueItem[])
    const [isFlushing, setIsFlushing] = useState(false)
    const [lastError, setLastError] = useState<Error | null>(null)

    // hydrate from localStorage
    useEffect(() => {
        try {
            const parsed = queueStorage.getQueue(storageQuizId)
            dispatch({ type: "replace", items: parsed })
        } catch {
            // ignore
        }
    }, [queueStorage, storageQuizId])

    // persist
    useEffect(() => {
        try {
            queueStorage.setQueue(storageQuizId, queue)
        } catch {
            // ignore
        }
    }, [queueStorage, storageQuizId, queue])

    const enqueue = useCallback((item: QueueItem) => {
        dispatch({ type: "enqueue", item })
    }, [])

    const upsertReorder = useCallback((order: string[]) => {
        dispatch({ type: "upsertReorder", order, quizId: quizId })
    }, [quizId])

    const upsertUpdate = useCallback((questionId: string, payload: Partial<QuestionApiRequest>) => {
        dispatch({ type: "upsertUpdate", questionId, payload, quizId: quizId })
    }, [quizId])

    const clear = useCallback(() => {
        dispatch({ type: "clear" })
        try {
            queueStorage.clearQueue(storageQuizId)
        } catch {
            // ignore
        }
        setLastError(null)
    }, [queueStorage, storageQuizId])

    const flush = useCallback(async (): Promise<{ items: QueueItem[]; idMap: Record<string, string> }> => {
        setIsFlushing(true)
        setLastError(null)
        try {
            const items = [...queue]
            const idMap: Record<string, string> = {}

            // process sequentially
            for (let idx = 0; idx < items.length; idx += 1) {
                const item = items[idx]
                try {
                    if (!item.quizId) continue
                    // if we previously created a question with a temporary id, translate references
                    if (item.questionId && idMap[item.questionId]) {
                        item.questionId = idMap[item.questionId]
                    }

                    if (item.op === "create") {
                        const req = item.payload as QuestionApiRequest
                        const created = await questionAdapterImpl.createQuestion(item.quizId, req)
                        // map temporary questionId (if present) to created id
                        if (item.questionId) {
                            idMap[item.questionId] = created.id
                        }
                        // also, if there are future items referencing the temp id in reorder payloads or questionId, they will be rewritten at processing time
                    } else if (item.op === "update") {
                        const req = item.payload as Partial<QuestionApiRequest>
                        if (!item.questionId) continue
                        await questionAdapterImpl.updateQuestion(item.quizId, item.questionId, req)
                    } else if (item.op === "delete") {
                        if (!item.questionId) continue
                        await questionAdapterImpl.deleteQuestion(item.quizId, item.questionId)
                    } else if (item.op === "reorder") {
                        let order = (item.payload as any)?.order as string[]
                        if (order && order.length) {
                            order = order.map((id) => idMap[id] ?? id)
                        }
                        await questionAdapterImpl.reorderQuestions(item.quizId, order ?? [])
                    }
                } catch (innerErr) {
                    // stop processing on first error and set lastError
                    const e = innerErr instanceof Error ? innerErr : new Error(String(innerErr))
                    setLastError(e)
                    throw e
                }
            }

            clear()
            return { items, idMap }
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            setLastError(e)
            return { items: [], idMap: {} }
        } finally {
            setIsFlushing(false)
        }
    }, [queue, clear])

    return {
        enqueue,
        clear,
        flush,
        upsertReorder,
        upsertUpdate,
        pendingCount: queue.length,
        isFlushing,
        lastError,
        queue,
    }
}
