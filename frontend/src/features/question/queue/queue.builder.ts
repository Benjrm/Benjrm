import type {
    CreateQuestionQueueItem,
    DeleteQuestionQueueItem,
    QueueItem,
    ReorderQueueItem,
    UpdateQuestionQueueItem,
} from "@/features/question/queue/queue.types.ts"

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

export function upsertDelete(
    state: QueueItem[],
    questionId: DeleteQuestionQueueItem["questionId"]
): QueueItem[] {
    const filtered = state.filter((i) => !(i.op === "delete" && i.questionId === questionId))
    return [...filtered, buildDeleteQueueItem(questionId)]
}
