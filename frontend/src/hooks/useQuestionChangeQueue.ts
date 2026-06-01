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
    lastError: Error | null
    queue: QueueItem[]
}

export default function useQuestionChangeQueue(quizId?: string): UseQuestionChangeQueueReturn {
    const queueStorage = useQuestionQueueStorage()
    const storageQuizId = quizId ?? "new"
    const [queue, dispatch] = useReducer(reducer, [] as QueueItem[])
    const [hydratedStorageQuizId, setHydratedStorageQuizId] = useState<string | null>(null)
    const [isFlushing, setIsFlushing] = useState(false)
    const [lastError, setLastError] = useState<Error | null>(null)

    if (hydratedStorageQuizId !== storageQuizId) {
        setHydratedStorageQuizId(storageQuizId)
        try {
            const parsed = queueStorage.getQueue(storageQuizId)
            dispatch({ type: "replace", items: parsed })
        } catch {
            dispatch({ type: "clear" })
        }
    }

    // persist
    useEffect(() => {
        if (hydratedStorageQuizId !== storageQuizId) return

        try {
            queueStorage.setQueue(storageQuizId, queue)
        } catch {
            // ignore
        }
    }, [queueStorage, storageQuizId, queue, hydratedStorageQuizId])

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
            queueStorage.clearQueue(storageQuizId)
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
            await items.reduce(async (prevPromise, rawItem) => {
                await prevPromise

                const item = { ...rawItem }

                if (!item.quizId) {
                    await Promise.resolve()
                    return undefined
                }

                try {
                    // translate temporary question IDs if we have a mapping
                    if (item.questionId && idMap[item.questionId]) {
                        item.questionId = idMap[item.questionId]
                    }

                    if (item.op === "create") {
                        const req = item.payload as QuestionApiRequest
                        const created = await questionAdapterImpl.createQuestion(item.quizId, req)
                        if (item.questionId) {
                            idMap[item.questionId] = created.id
                        }
                        succeededIds.add(item.id)
                    } else if (item.op === "update") {
                        const req = item.payload as Partial<QuestionApiRequest>
                        if (!item.questionId) {
                            await Promise.resolve()
                            return undefined
                        }

                        const isTemp = String(item.questionId).startsWith("temp-")
                        if (isTemp && !idMap[item.questionId]) {
                            // Try to find a queued create for this temp id
                            const queuedCreate = items.find(
                                (x) => x.op === "create" && x.questionId === item.questionId
                            )
                            if (queuedCreate) {
                                const createReq = queuedCreate.payload as QuestionApiRequest
                                const created = await questionAdapterImpl.createQuestion(
                                    item.quizId,
                                    createReq
                                )
                                if (queuedCreate.questionId)
                                    idMap[queuedCreate.questionId] = created.id
                                // also map current item's questionId to the created id
                                idMap[item.questionId] = created.id
                                await Promise.resolve()
                                return undefined
                            }

                            const maybeCreate = req as QuestionApiRequest
                            const opts = (maybeCreate as Partial<QuestionApiRequest>)?.options
                            const hasOptions = Array.isArray(opts) && opts.length >= 2
                            if (
                                maybeCreate &&
                                typeof maybeCreate.question === "string" &&
                                maybeCreate.type &&
                                hasOptions
                            ) {
                                const created = await questionAdapterImpl.createQuestion(
                                    item.quizId,
                                    maybeCreate
                                )
                                idMap[item.questionId] = created.id
                                await Promise.resolve()
                                return undefined
                            }

                            // otherwise, skip updating now and let queue handling
                            // or a later flush handle creation first
                            await Promise.resolve()
                            return undefined
                        }

                        await questionAdapterImpl.updateQuestion(item.quizId, item.questionId, req)
                        succeededIds.add(item.id)
                    } else if (item.op === "delete") {
                        if (!item.questionId) {
                            await Promise.resolve()
                            return undefined
                        }
                        await questionAdapterImpl.deleteQuestion(item.quizId, item.questionId)
                        succeededIds.add(item.id)
                    } else if (item.op === "reorder") {
                        const payload = item.payload as { order?: string[] } | undefined
                        let order = payload?.order ?? []
                        if (order.length) {
                            // Map known ids
                            order = order.map((id) => idMap[id] ?? id)
                            const tempIdPromises = order.map(async (id) => {
                                if (String(id).startsWith("temp-") && !idMap[id]) {
                                    const queuedCreate = items.find(
                                        (x) => x.op === "create" && x.questionId === id
                                    )
                                    if (queuedCreate) {
                                        const created = await questionAdapterImpl.createQuestion(
                                            item.quizId,
                                            queuedCreate.payload as QuestionApiRequest
                                        )
                                        if (queuedCreate.questionId) {
                                            idMap[queuedCreate.questionId] = created.id
                                        }
                                        return created.id
                                    }
                                }
                                return id
                            })
                            order = await Promise.all(tempIdPromises)
                        }

                        const unmapped = order.find((id) => String(id).startsWith("temp-"))
                        if (unmapped) {
                            await Promise.resolve()
                            return undefined
                        }

                        await questionAdapterImpl.reorderQuestions(item.quizId, order)
                        succeededIds.add(item.id)
                    }

                    await Promise.resolve()
                    return undefined
                } catch (innerErr) {
                    const e = innerErr instanceof Error ? innerErr : new Error(String(innerErr))
                    setLastError(e)
                    throw e
                }
            }, Promise.resolve())

            // Remove only successfully processed items from the persisted queue.
            // Keep any skipped items (e.g., reorders with unmapped temp ids) for a later flush.
            try {
                const remaining = queue.filter((q) => !succeededIds.has(q.id))
                dispatch({ type: "replace", items: remaining })
            } catch {
                // ignore persistence errors here
            }

            return { items, idMap }
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            setLastError(e)
            return { items: [], idMap: {} }
        } finally {
            setIsFlushing(false)
        }
    }, [queue])

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
