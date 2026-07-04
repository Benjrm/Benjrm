import type { Action, QueueItem } from "@/features/question/queue/types.ts"
import {
    upsertCreate,
    upsertDelete,
    upsertReorder,
    upsertUpdate,
} from "@/features/question/queue/builder.ts"

/** Reducer backing `useQuestionChangeQueue`'s pending-edits queue. */
export default function reducer(state: QueueItem[], action: Action): QueueItem[] {
    switch (action.type) {
        case "clear":
            return []
        case "replace":
            return action.items
        case "upsertCreate":
            return upsertCreate(state, action.questionId, action.payload)
        case "upsertReorder":
            return upsertReorder(state, { order: action.order })
        case "upsertUpdate":
            return upsertUpdate(state, action.questionId, action.payload)
        case "upsertDelete":
            return upsertDelete(state, action.questionId)
        default:
            return state
    }
}
