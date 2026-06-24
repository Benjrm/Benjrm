import { useMemo } from "react"
import { createListStorage } from "@/utils/listStorage"
import type { ListStorage } from "@/utils/listStorage"
import type { QueueItem } from "@/queue/queue.types.ts"

export default function useQuestionQueueStorage(): ListStorage<QueueItem> {
    return useMemo(() => createListStorage<QueueItem>("quiz:queue"), [])
}
