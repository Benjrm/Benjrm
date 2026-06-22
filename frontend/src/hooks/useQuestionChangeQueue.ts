import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import useQuestionQueueStorage from "@/api/questions/hooks/useQuestionQueueStorage.ts"
import type { QueueItem } from "@/queue/queue.types.ts"
import type QuestionQueueError from "@/queue/queue.error.ts"
import reducer from "@/queue/queue.reducer.ts"
import type { QuestionRequest } from "@/api/questions/questions.types.ts"
import processQueue, { normalizeError, sortQueue } from "@/queue/queue.operations.ts"

export interface UseQuestionChangeQueueReturn {
    clear: () => void
    cleanup: (isUsed: (id: string) => Promise<boolean>) => void
    flush: () => Promise<{ items: QueueItem[]; idMap: Record<string, string> }>
    upsertCreate: (questionId: string, payload: QuestionRequest) => void
    upsertReorder: (order: string[]) => void
    upsertUpdate: (questionId: string, payload: QuestionRequest) => void
    upsertDelete: (questionId: string) => void
    pendingCount: number
    isFlushing: boolean
    lastError: QuestionQueueError | null
    queue: QueueItem[]
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

    const upsertCreate = useCallback((questionId: string, payload: QuestionRequest) => {
        dispatch({ type: "upsertCreate", questionId, payload })
    }, [])

    const upsertReorder = useCallback((order: string[]) => {
        dispatch({ type: "upsertReorder", order })
    }, [])

    const upsertUpdate = useCallback((questionId: string, payload: QuestionRequest) => {
        dispatch({ type: "upsertUpdate", questionId, payload })
    }, [])

    const upsertDelete = useCallback((questionId: string) => {
        dispatch({ type: "upsertDelete", questionId })
    }, [])

    const clear = useCallback(() => {
        dispatch({ type: "clear" })
        try {
            queueStorage.delete(storageQuizId)
        } catch {
            // ignore
        }
        setLastError(null)
    }, [queueStorage, storageQuizId])

    const cleanup = useCallback(
        (isUsed: (id: string) => Promise<boolean>) => {
            queueStorage.cleanup(isUsed)
        },
        [queueStorage]
    )

    const flush = useCallback(async (): Promise<{
        items: QueueItem[]
        idMap: Record<string, string>
    }> => {
        setIsFlushing(true)
        setLastError(null)

        const updateQueueState = (
            qi: QueueItem[],
            succeededIds: Set<string>,
            idMap: Record<string, string>
        ) => {
            const remaining = qi
                .filter((q) => !succeededIds.has(q.id))
                .map((item) => {
                    if (item.op !== "reorder") return item

                    return {
                        ...item,
                        payload: {
                            order: item.payload.order.map((id) => idMap[id] ?? id),
                        },
                    }
                })
            dispatch({ type: "replace", items: remaining })

            if (remaining.length === 0) {
                queueStorage.delete(storageQuizId)
            }
        }

        try {
            const sortedQueue = sortQueue(queue)
            if (!quizId) {
                throw new Error("Quiz id is required to flush the question change queue.")
            }
            const { idMap, succeededIds, failed } = await processQueue(sortedQueue, quizId)
            updateQueueState(queue, succeededIds, idMap)

            setLastError(normalizeError(failed))

            return { items: sortedQueue, idMap }
        } finally {
            setIsFlushing(false)
        }
    }, [queue, queueStorage, quizId, storageQuizId])

    return {
        clear,
        cleanup,
        flush,
        upsertCreate,
        upsertReorder,
        upsertUpdate,
        upsertDelete,
        pendingCount: queue.length,
        isFlushing,
        lastError,
        queue,
    }
}
