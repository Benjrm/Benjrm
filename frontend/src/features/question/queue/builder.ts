import type {
    CreateQuestionQueueItem,
    DeleteQuestionQueueItem,
    QueueItem,
    ReorderQueueItem,
    UpdateQuestionQueueItem,
} from "@/features/question/queue/types.ts"

function buildCreateQuestionQueueItem(
    questionId: string,
    payload: CreateQuestionQueueItem["payload"]
): CreateQuestionQueueItem {
    return {
        id: `create-${questionId}-${Date.now()}`,
        op: "create",
        questionId,
        payload,
    }
}

/**
 * Adds (or replaces) a "create" entry for `questionId` in the queue.
 * Any pre-existing create entry for the same question is dropped first, so
 * repeated edits before a flush collapse into a single create operation.
 */
export function upsertCreate(
    state: QueueItem[],
    questionId: string,
    payload: CreateQuestionQueueItem["payload"]
): QueueItem[] {
    const filtered = state.filter((i) => !(i.op === "create" && i.questionId === questionId))
    return [...filtered, buildCreateQuestionQueueItem(questionId, payload)]
}

function buildUpdateQuestionQueueItem(
    questionId: string,
    payload: UpdateQuestionQueueItem["payload"]
): UpdateQuestionQueueItem {
    return {
        id: `update-${questionId}-${Date.now()}`,
        op: "update",
        questionId,
        payload,
    }
}

/**
 * Adds (or replaces) an "update" entry for `questionId` in the queue.
 * Any pre-existing update entry for the same question is dropped first, so
 * repeated edits before a flush collapse into a single update operation.
 */
export function upsertUpdate(
    state: QueueItem[],
    questionId: string,
    payload: UpdateQuestionQueueItem["payload"]
): QueueItem[] {
    const filtered = state.filter((i) => !(i.op === "update" && i.questionId === questionId))
    return [...filtered, buildUpdateQuestionQueueItem(questionId, payload)]
}

function buildReorderQueueItem(payload: ReorderQueueItem["payload"]): ReorderQueueItem {
    return {
        id: `reorder-${Date.now()}`,
        op: "reorder",
        payload,
    }
}

/**
 * Adds (or replaces) the single "reorder" entry in the queue. There can only
 * ever be one pending reorder, since a new order fully supersedes the last.
 */
export function upsertReorder(
    state: QueueItem[],
    payload: ReorderQueueItem["payload"]
): QueueItem[] {
    const filtered = state.filter((i) => i.op !== "reorder")
    return [...filtered, buildReorderQueueItem(payload)]
}

function buildDeleteQueueItem(
    questionId: DeleteQuestionQueueItem["questionId"]
): DeleteQuestionQueueItem {
    return {
        id: `delete-${questionId}-${Date.now()}`,
        op: "delete",
        questionId,
    }
}

/**
 * Adds (or replaces) a "delete" entry for `questionId` in the queue.
 *
 * This function also deletes any other operations for the deleted question.
 */
export function upsertDelete(
    state: QueueItem[],
    questionId: DeleteQuestionQueueItem["questionId"]
): QueueItem[] {
    const filtered = state.filter((i) => !(i.op !== "reorder" && i.questionId === questionId))
    return [...filtered, buildDeleteQueueItem(questionId)]
}
