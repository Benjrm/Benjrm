/**
 * A storage abstraction for managing lists of values identified by a string key.
 * Implementations may persist data in browser storage, memory, or any other
 * backing store.
 */
export interface ListStorage<T> {
    /**
     * Retrieves all values associated with the given identifier.
     * @param id The unique identifier of the stored list.
     * @returns A copy of the stored values, or an empty array if no values exist.
     */
    get: (id: string) => T[]

    /**
     * Stores the provided values under the given identifier, replacing any
     * previously stored values.
     * @param id The unique identifier of the stored list.
     * @param values The values to persist.
     */
    set: (id: string, values: T[]) => void
    /**
     * Removes all values associated with the given identifier.
     *
     * @param id The unique identifier of the stored list.
     */
    delete: (id: string) => void
    cleanup: (isUsed: (id: string) => Promise<boolean>) => Promise<void>
}

/**
 * Creates a list storage instance that persists values in browser localStorage
 * and keeps an in-memory fallback copy.
 * Each stored list is scoped by the provided storage key and an identifier,
 * resulting in keys of the form `${storageKey}:${id}`.
 * @param storageKey The namespace used to prefix all storage entries.
 * @returns A configured list storage instance.
 */
export function createListStorage<T>(storageKey: string): ListStorage<T> {
    const memoryStore = new Map<string, T[]>()

    /**
     * Reads a deep copy of the values stored in memory for the given identifier.
     * @param id The identifier of the stored list.
     * @returns A cloned array of stored values, or an empty array if none exist.
     */
    const readFromMemory = (id: string): T[] => {
        const questions = memoryStore.get(id) ?? []
        return structuredClone(questions)
    }

    /**
     * Builds the fully qualified storage key for the given identifier.
     * @param id The identifier of the stored list.
     * @returns The namespaced storage key.
     */
    const getStorageKey = (id: string): string => `${storageKey}:${id}`

    /**
     * Determines whether browser storage APIs are available in the current
     * execution environment.
     * @returns `true` if localStorage can be accessed; otherwise `false`.
     */
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
                if (cloned.length === 0) {
                    localStorage.removeItem(getStorageKey(id))
                } else {
                    localStorage.setItem(getStorageKey(id), JSON.stringify(cloned))
                }
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

        async cleanup(isUsed: (id: string) => Promise<boolean>) {
            if (!isBrowserAvailable()) return

            const prefix = `${storageKey}:`

            try {
                const promises: Promise<void>[] = []
                for (let i = 0; i < localStorage.length; i += 1) {
                    const key = localStorage.key(i)
                    if (key?.startsWith(prefix)) {
                        const id = key.substring(prefix.length)
                        promises.push(
                            (async () => {
                                if (!(await isUsed(id))) {
                                    try {
                                        localStorage.removeItem(key)
                                    } catch {
                                        // ignore storage failures
                                    }
                                }
                            })()
                        )
                    }
                }
                await Promise.all(promises)
            } catch {
                // ignore storage failures
            }
        },
    }
}
