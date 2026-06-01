export interface QueueStorageItem {
    id: string
    op: "create" | "update" | "delete" | "reorder"
    quizId: string
    questionId?: string
    payload?: unknown
    createdAt: string
}

export interface QuestionQueueStorage {
    getQueue: (quizId: string) => QueueStorageItem[]
    setQueue: (quizId: string, queue: QueueStorageItem[]) => void
    clearQueue: (quizId: string) => void
}

function isBrowserAvailable(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function storageKey(quizId: string): string {
    return `quiz:queue:${quizId}`
}

function cloneQueue(queue: QueueStorageItem[]): QueueStorageItem[] {
    return queue.map((item) => ({ ...item, payload: item.payload }))
}

export function createQuestionQueueStorage(): QuestionQueueStorage {
    const memoryStore = new Map<string, QueueStorageItem[]>()

    const readFromMemory = (quizId: string): QueueStorageItem[] =>
        cloneQueue(memoryStore.get(quizId) ?? [])

    return {
        getQueue(quizId: string): QueueStorageItem[] {
            if (!isBrowserAvailable()) {
                return readFromMemory(quizId)
            }

            try {
                const raw = localStorage.getItem(storageKey(quizId))
                if (!raw) return readFromMemory(quizId)

                const parsed = JSON.parse(raw) as QueueStorageItem[]
                const queue = parsed ?? []
                memoryStore.set(quizId, cloneQueue(queue))
                return cloneQueue(queue)
            } catch {
                return readFromMemory(quizId)
            }
        },

        setQueue(quizId: string, queue: QueueStorageItem[]): void {
            const cloned = cloneQueue(queue)
            memoryStore.set(quizId, cloned)

            if (!isBrowserAvailable()) return

            try {
                localStorage.setItem(storageKey(quizId), JSON.stringify(cloned))
            } catch {
                // keep the in-memory copy even if browser storage fails
            }
        },

        clearQueue(quizId: string): void {
            memoryStore.delete(quizId)

            if (!isBrowserAvailable()) return

            try {
                localStorage.removeItem(storageKey(quizId))
            } catch {
                // ignore storage failures
            }
        },
    }
}
