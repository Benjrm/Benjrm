import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl"
import type { QuestionApiRequest } from "@/api/questions/types/question.api.ts"
import useQuestionQueueStorage from "@/api/questions/hooks/useQuestionQueueStorage.ts"
import { ApiError } from "@/api/utils"

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
    | { type: "removeQuestion"; questionId: string }
    | {
          type: "upsertCreate"
          questionId: string
          payload: QuestionApiRequest
          quizId?: string
      }
    | { type: "upsertReorder"; order: string[]; quizId?: string }
    | {
          type: "upsertUpdate"
          questionId: string
          payload: Partial<QuestionApiRequest>
          quizId?: string
      }

function reducer(state: QueueItem[], action: Action): QueueItem[] {
    switch (action.type) {
        case "enqueue":
            return [...state, action.item]
        case "clear":
            return []
        case "replace":
            return action.items
        case "removeQuestion":
            return state.filter(
                (item) => !(item.questionId === action.questionId && item.op !== "delete")
            )
        case "upsertCreate":
            return [
                ...state.filter((i) => !(i.op === "create" && i.questionId === action.questionId)),
                {
                    id: `create-${action.questionId}-${Date.now()}`,
                    op: "create",
                    quizId: action.quizId ?? "",
                    questionId: action.questionId,
                    payload: action.payload,
                    createdAt: new Date().toISOString(),
                },
            ]
        case "upsertReorder":
            return [
                ...state.filter((i) => i.op !== "reorder"),
                {
                    id: `reorder-${Date.now()}`,
                    op: "reorder",
                    quizId: action.quizId ?? "",
                    payload: { order: action.order },
                    createdAt: new Date().toISOString(),
                },
            ]
        case "upsertUpdate":
            return [
                ...state.filter((i) => !(i.op === "update" && i.questionId === action.questionId)),
                {
                    id: `update-${action.questionId}-${Date.now()}`,
                    op: "update",
                    quizId: action.quizId ?? "",
                    questionId: action.questionId,
                    payload: action.payload,
                    createdAt: new Date().toISOString(),
                },
            ]
        default:
            return state
    }
}

export interface UseQuestionChangeQueueReturn {
    enqueue: (item: QueueItem) => void
    clear: () => void
    flush: () => Promise<{ items: QueueItem[]; idMap: Record<string, string> }>
    removeQuestion: (questionId: string) => void
    upsertCreate: (questionId: string, payload: QuestionApiRequest) => void
    upsertReorder: (order: string[]) => void
    upsertUpdate: (questionId: string, payload: Partial<QuestionApiRequest>) => void
    pendingCount: number
    isFlushing: boolean
    lastError: QuestionQueueError | null
    queue: QueueItem[]
}

export class QuestionQueueError extends Error {
    question: string | undefined

    error: Error | ApiError

    constructor(question: string | undefined, error: Error | ApiError) {
        super(error.message)
        this.question = question
        this.error = error
    }
}

type ProcessResult =
    | { status: "success"; createdId?: string }
    | { status: "skipped"; reason?: string }

async function processCreateOp(item: QueueItem): Promise<ProcessResult> {
    const req = item.payload as QuestionApiRequest
    const created = await questionAdapterImpl.createQuestion(item.quizId, req)
    return { status: "success", createdId: created.id }
}

async function processUpdateOp(item: QueueItem): Promise<ProcessResult> {
    if (!item.questionId) return { status: "skipped", reason: "no_question_id" }

    if (String(item.questionId).startsWith("temp-")) {
        return { status: "skipped", reason: "unresolved_temp_id" }
    }

    const req = item.payload as Partial<QuestionApiRequest>
    await questionAdapterImpl.updateQuestion(item.quizId, item.questionId, req)
    return { status: "success" }
}

async function processDeleteOp(item: QueueItem): Promise<ProcessResult> {
    if (!item.questionId) return { status: "skipped", reason: "no_question_id" }

    // If we are deleting a temp ID that was never mapped to a real ID,
    // the question was never created on the server, so we can just consider it deleted.
    if (String(item.questionId).startsWith("temp-")) {
        return { status: "success" }
    }

    await questionAdapterImpl.deleteQuestion(item.quizId, item.questionId)
    return { status: "success" }
}

async function processReorderOp(
    item: QueueItem,
    idMap: Record<string, string>
): Promise<ProcessResult> {
    const payload = item.payload as { order?: string[] } | undefined
    let order = payload?.order ?? []

    if (order.length === 0) return { status: "skipped", reason: "missing_order_payload" }

    // Resolve temp IDs to real IDs if they exist in the idMap
    order = order.map((id) => idMap[id] ?? id)

    // If any IDs remain unresolved, we skip the reorder for now
    const hasUnresolvedTempIds = order.some((id) => String(id).startsWith("temp-"))
    if (hasUnresolvedTempIds) {
        return { status: "skipped", reason: "unresolved_temp_ids_in_order" }
    }

    await questionAdapterImpl.reorderQuestions(item.quizId, order)
    return { status: "success" }
}

export default function useQuestionChangeQueue(quizId?: string): UseQuestionChangeQueueReturn {
    const queueStorage = useQuestionQueueStorage()
    const storageQuizId = quizId ?? "new"
    const [queue, dispatch] = useReducer(reducer, [] as QueueItem[])
    const hydratedStorageQuizIdRef = useRef<string | null>(null)
    const [isFlushing, setIsFlushing] = useState(false)
    const [lastError, setLastError] = useState<QuestionQueueError | null>(null)

    // Hydrate the queue from local storage when the quiz ID changes
    useEffect(() => {
        if (hydratedStorageQuizIdRef.current === storageQuizId) return

        try {
            const parsed = queueStorage.get(storageQuizId)
            dispatch({ type: "replace", items: parsed })
        } catch {
            dispatch({ type: "clear" })
        }
        hydratedStorageQuizIdRef.current = storageQuizId
    }, [storageQuizId, queueStorage])

    // Persist the queue to local storage whenever it changes
    useEffect(() => {
        if (hydratedStorageQuizIdRef.current !== storageQuizId) return

        try {
            queueStorage.set(storageQuizId, queue)
        } catch {
            // gracefully ignore persistence errors
        }
    }, [queueStorage, storageQuizId, queue])

    const enqueue = useCallback((item: QueueItem) => {
        dispatch({ type: "enqueue", item })
    }, [])

    const removeQuestion = useCallback((questionId: string) => {
        dispatch({ type: "removeQuestion", questionId })
    }, [])

    const upsertCreate = useCallback(
        (questionId: string, payload: QuestionApiRequest) => {
            dispatch({ type: "upsertCreate", questionId, payload, quizId })
        },
        [quizId]
    )

    const upsertReorder = useCallback(
        (order: string[]) => {
            dispatch({ type: "upsertReorder", order, quizId })
        },
        [quizId]
    )

    const upsertUpdate = useCallback(
        (questionId: string, payload: Partial<QuestionApiRequest>) => {
            dispatch({ type: "upsertUpdate", questionId, payload, quizId })
        },
        [quizId]
    )

    const clear = useCallback(() => {
        dispatch({ type: "clear" })
        try {
            queueStorage.delete(storageQuizId)
        } catch {
            // ignore
        }
        setLastError(null)
    }, [queueStorage, storageQuizId])

    const flush = useCallback(async (): Promise<{
        items: QueueItem[]
        idMap: Record<string, string>
    }> => {
        setIsFlushing(true)
        setLastError(null)
        try {
            // Ensure operations are processed in the correct logical order
            const items = [...queue].sort((a, b) => {
                const order: Record<string, number> = {
                    delete: 0,
                    create: 1,
                    update: 2,
                    reorder: 3,
                }
                return (order[a.op] ?? 99) - (order[b.op] ?? 99)
            })

            const idMap: Record<string, string> = {}
            const succeededIds = new Set<string>()

            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < items.length; i += 1) {
                const item = { ...items[i] }
                if (item.quizId) {
                    try {
                        // Pre-translate ID if already mapped by a previous create operation
                        if (item.questionId && idMap[item.questionId]) {
                            item.questionId = idMap[item.questionId]
                        }

                        let result: ProcessResult = { status: "skipped" }

                        switch (item.op) {
                            case "create":
                                // eslint-disable-next-line no-await-in-loop
                                result = await processCreateOp(item)
                                if (
                                    result.status === "success" &&
                                    item.questionId &&
                                    result.createdId
                                ) {
                                    // Record the mapping from temporary ID to real backend ID
                                    idMap[item.questionId] = result.createdId
                                }
                                break
                            case "update":
                                // eslint-disable-next-line no-await-in-loop
                                result = await processUpdateOp(item)
                                break
                            case "delete":
                                // eslint-disable-next-line no-await-in-loop
                                result = await processDeleteOp(item)
                                break
                            case "reorder":
                                // eslint-disable-next-line no-await-in-loop
                                result = await processReorderOp(item, idMap)
                                break
                            default:
                                break
                        }

                        if (result.status === "success") {
                            succeededIds.add(item.id)
                        } else {
                            throw new Error(result.reason)
                        }
                    } catch (innerErr) {
                        const e =
                            innerErr instanceof ApiError || innerErr instanceof Error
                                ? innerErr
                                : new Error(String(innerErr))
                        const error = new QuestionQueueError(item.questionId, e)
                        setLastError(error)
                        throw error
                    }
                }
            }

            // Remove only successfully processed items from the persisted queue.
            // Keep any skipped items (e.g., reorders with unmapped temp ids) for a later flush.
            try {
                const remaining = queue
                    .filter((q) => !succeededIds.has(q.id))
                    .map((item) => {
                        if (item.op !== "reorder") return item

                        const payload = item.payload as { order?: string[] } | undefined
                        const order = (payload?.order ?? []).map((id) => idMap[id] ?? id)

                        return {
                            ...item,
                            payload: { ...(payload ?? {}), order },
                        }
                    })
                dispatch({ type: "replace", items: remaining })

                if (remaining.length === 0) {
                    queueStorage.delete(storageQuizId)
                }
            } catch {
                // ignore persistence errors here
            }

            return { items, idMap }
        } catch (err) {
            let e: QuestionQueueError
            if (err instanceof QuestionQueueError) {
                e = err
            } else {
                const apiError =
                    err instanceof ApiError || err instanceof Error ? err : new Error(String(err))
                e = new QuestionQueueError(undefined, apiError)
            }
            setLastError(e)
            throw e
        } finally {
            setIsFlushing(false)
        }
    }, [queue, queueStorage, storageQuizId])

    return {
        enqueue,
        clear,
        flush,
        removeQuestion,
        upsertCreate,
        upsertReorder,
        upsertUpdate,
        pendingCount: queue.length,
        isFlushing,
        lastError,
        queue,
    }
}
