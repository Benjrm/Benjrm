export interface ListStorage<T> {
    get: (id: string) => T[]
    set: (id: string, values: T[]) => void
    delete: (id: string) => void
}

export function createListStorage<T>(storageKey: string): ListStorage<T> {
    const memoryStore = new Map<string, T[]>()

    const readFromMemory = (id: string): T[] => {
        const questions = memoryStore.get(id) ?? []
        return structuredClone(questions)
    }

    const getStorageKey = (id: string): string => `${storageKey}:${id}`

    const isBrowserAvailable = (): boolean =>
        typeof window !== "undefined" && typeof localStorage !== "undefined"

    return {
        get(id: string): T[] {
            if (!isBrowserAvailable()) {
                return readFromMemory(id)
            }

            try {
                const raw = localStorage.getItem(getStorageKey(id))
                if (!raw) return readFromMemory(id)

                const parsed = JSON.parse(raw) as T[]
                const values = parsed ?? []
                memoryStore.set(id, structuredClone(values))
                return values
            } catch {
                return readFromMemory(id)
            }
        },

        set(id: string, values: T[]): void {
            const cloned = structuredClone(values)
            memoryStore.set(id, cloned)

            if (!isBrowserAvailable()) return

            try {
                localStorage.setItem(getStorageKey(id), JSON.stringify(cloned))
            } catch {
                // keep the in-memory copy even if browser storage fails
            }
        },

        delete(id: string): void {
            memoryStore.delete(id)

            if (!isBrowserAvailable()) return

            try {
                localStorage.removeItem(getStorageKey(id))
            } catch {
                // ignore storage failures
            }
        },
    }
}
