import { useMemo } from "react"
import { createListStorage } from "@/utils/listStorage"
import type { ListStorage } from "@/utils/listStorage"
import type { QueueItem } from "@/hooks/useQuestionChangeQueue"

export default function useQuestionQueueStorage(): ListStorage<QueueItem> {
    return useMemo(() => createListStorage<QueueItem>("quiz:queue"), [])
}
