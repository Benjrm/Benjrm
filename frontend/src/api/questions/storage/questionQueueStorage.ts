import type { QueueItem } from "@/hooks/useQuestionChangeQueue"

export interface QuestionQueueStorage {
    getQueue: (quizId: string) => QueueItem[]
    setQueue: (quizId: string, queue: QueueItem[]) => void
    clearQueue: (quizId: string) => void
}

function isBrowserAvailable(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function storageKey(quizId: string): string {
    return `quiz:${quizId}:queue`
}

function cloneQueue(queue: QueueItem[]): QueueItem[] {
    return queue.map((item) => ({ ...item, payload: item.payload }))
}

export function createQuestionQueueStorage(): QuestionQueueStorage {
    const memoryStore = new Map<string, QueueItem[]>()

    const readFromMemory = (quizId: string): QueueItem[] =>
        cloneQueue(memoryStore.get(quizId) ?? [])

    return {
        getQueue(quizId: string): QueueItem[] {
            if (!isBrowserAvailable()) {
                return readFromMemory(quizId)
            }

            try {
                const raw = localStorage.getItem(storageKey(quizId))
                if (!raw) return readFromMemory(quizId)

                const parsed = JSON.parse(raw) as QueueItem[]
                const queue = parsed ?? []
                memoryStore.set(quizId, cloneQueue(queue))
                return cloneQueue(queue)
            } catch {
                return readFromMemory(quizId)
            }
        },

        setQueue(quizId: string, queue: QueueItem[]): void {
            if (queue.length === 0) {
                this.clearQueue(quizId)
                return
            }

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
