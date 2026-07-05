import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import useQuestionQueueStorage from "@/features/question/hooks/useQuestionQueueStorage.ts"
import type { QueueItem } from "@/features/question/queue/types.ts"
import reducer from "@/features/question/queue/reducer.ts"
import type { QuestionRequest, UpdateQuestionRequest } from "@/features/question/types/questions.ts"
import processQueue, { sortQueue } from "@/features/question/queue/operations.ts"

/** Return value of {@link useQuestionChangeQueue}. */
interface UseQuestionChangeQueueReturn {
    clear: () => void
    cleanup: (isUsed: (id: string) => Promise<boolean>) => void
    flush: () => Promise<{
        items: QueueItem[]
        idMap: Record<string, string>
        optionIdsByQuestion: Record<string, string[]>
        failed: { itemId: string; error: string }[]
    }>
    upsertCreate: (questionId: string, payload: QuestionRequest) => void
    upsertReorder: (order: string[]) => void
    upsertUpdate: (questionId: string, payload: UpdateQuestionRequest) => void
    upsertDelete: (questionId: string) => void
    pendingCount: number
    isFlushing: boolean
    queue: QueueItem[]
}

/**
 * Manages an offline-first queue of pending question edits (create, update,
 * delete, reorder) for the quiz editor.
 *
 * Edits are applied optimistically to a local queue (persisted to storage via
 * {@link useQuestionQueueStorage} and keyed by `quizId`, or `"new"` for a
 * not-yet-created quiz) instead of being sent to the backend immediately.
 * Call the returned `flush` to submit the queued operations in dependency
 * order (see {@link processQueue}).
 *
 * @param quizId - Id of the quiz being edited, or `undefined` while the quiz
 * itself has not been created yet.
 */
export default function useQuestionChangeQueue(quizId?: string): UseQuestionChangeQueueReturn {
    const queueStorage = useQuestionQueueStorage()
    const storageQuizId = quizId ?? "new"
    const [queue, dispatch] = useReducer(reducer, [] as QueueItem[])
    const hydratedStorageQuizIdRef = useRef<string | null>(null)
    const [isFlushing, setIsFlushing] = useState(false)

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

    const upsertUpdate = useCallback((questionId: string, payload: UpdateQuestionRequest) => {
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
        optionIdsByQuestion: Record<string, string[]>
        failed: { itemId: string; error: string }[]
    }> => {
        setIsFlushing(true)
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
            const { idMap, optionIdsByQuestion, succeededIds, failed } = await processQueue(
                sortedQueue,
                quizId
            )
            updateQueueState(queue, succeededIds, idMap)

            return { items: sortedQueue, idMap, optionIdsByQuestion, failed }
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
        queue,
    }
}
