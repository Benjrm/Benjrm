import { useMemo } from "react"
import { createListStorage } from "@/shared/utils/listStorage"
import type { ListStorage } from "@/shared/utils/listStorage"
import type { QueueItem } from "@/features/question/queue/queue.types.ts"

export default function useQuestionQueueStorage(): ListStorage<QueueItem> {
    return useMemo(() => createListStorage<QueueItem>("quiz:queue"), [])
}
