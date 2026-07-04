import { useMemo } from "react"
import { createListStorage } from "@/shared/utils/listStorage"
import type { ListStorage } from "@/shared/utils/listStorage"
import type { QueueItem } from "@/features/question/queue/types.ts"

/**
 * Provides a stable, memoized {@link ListStorage} for the question change
 * queue, namespaced under `"quiz:queue"` (see `useQuestionChangeQueue`).
 */
export default function useQuestionQueueStorage(): ListStorage<QueueItem> {
    return useMemo(() => createListStorage<QueueItem>("quiz:queue"), [])
}
