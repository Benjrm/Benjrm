import questionAdapterImpl from "@/api/questions/adapter/questionAdapterImpl.ts"
import type {
    CreateQuestionQueueItem,
    DeleteQuestionQueueItem,
    ProcessResult,
    QueueItem,
    ReorderQueueItem,
    UpdateQuestionQueueItem,
} from "@/queue/queue.types.ts"
import assertNever from "@/utils/assertNever.ts"

async function processCreateOp<QI extends Extract<QueueItem, CreateQuestionQueueItem>>(
    item: QI,
    quizId: string
): Promise<ProcessResult> {
    const { payload } = item
    const created = await questionAdapterImpl.createQuestion(quizId, payload)

    let optionIds: string[] | undefined
    if (created.type !== "SLIDE") {
        optionIds = created.options.map((option) => option.id)
    }
    return { status: "success", createdId: created.id, optionIds }
}

async function processUpdateOp<QI extends Extract<QueueItem, UpdateQuestionQueueItem>>(
    item: QI,
    quizId: string
): Promise<ProcessResult> {
    if (!item.questionId) return { status: "skipped", reason: "no_question_id" }

    if (String(item.questionId).startsWith("temp-")) {
        return { status: "skipped", reason: "unresolved_temp_id" }
    }

    const updated = await questionAdapterImpl.updateQuestion(quizId, item.questionId, item.payload)

    let optionIds: string[] | undefined
    if (updated.type !== "SLIDE") {
        optionIds = updated.options.map((option) => option.id)
    }
    return { status: "success", optionIds }
}

async function processDeleteOp<QI extends Extract<QueueItem, DeleteQuestionQueueItem>>(
    item: QI,
    quizId: string
): Promise<ProcessResult> {
    if (!item.questionId) return { status: "skipped", reason: "no_question_id" }

    // If we are deleting a temp ID that was never mapped to a real ID,
    // the question was never created on the server, so we can just consider it deleted.
    if (String(item.questionId).startsWith("temp-")) {
        return { status: "success" }
    }

    await questionAdapterImpl.deleteQuestion(quizId, item.questionId)
    return { status: "success" }
}

async function processReorderOp<QI extends Extract<QueueItem, ReorderQueueItem>>(
    item: QI,
    idMap: Record<string, string>,
    quizId: string
): Promise<ProcessResult> {
    let { order } = item.payload

    if (order.length === 0) return { status: "skipped", reason: "missing_order_payload" }

    // Resolve temp IDs to real IDs if they exist in the idMap
    order = order.map((id) => idMap[id] ?? id)

    // If any IDs remain unresolved, we skip the reorder for now
    const hasUnresolvedTempIds = order.some((id) => String(id).startsWith("temp-"))
    if (hasUnresolvedTempIds) {
        return { status: "skipped", reason: "unresolved_temp_ids_in_order" }
    }

    await questionAdapterImpl.reorderQuestions(quizId, order)
    return { status: "success" }
}

async function processQueueItem(
    item: QueueItem,
    idMap: Record<string, string>,
    quizId: string
): Promise<ProcessResult> {
    switch (item.op) {
        case "create":
            return processCreateOp(item, quizId)
        case "update":
            return processUpdateOp(item, quizId)
        case "delete":
            return processDeleteOp(item, quizId)
        case "reorder":
            return processReorderOp(item, idMap, quizId)
        default:
            return assertNever(item)
    }
}

export default async function processQueue(
    items: QueueItem[],
    quizId: string
): Promise<{
    idMap: Record<string, string>
    optionIdsByQuestion: Record<string, string[]>
    succeededIds: Set<string>
    failed: { itemId: string; error: string }[]
}> {
    const idMap: Record<string, string> = {}

    // maps client-side, temporary question IDs to server-side generated option IDs for each question
    const optionIdsByQuestion: Record<string, string[]> = {}
    const succeededIds = new Set<string>()
    const failed: { itemId: string; error: string }[] = []

    // eslint-disable-next-line no-restricted-syntax
    for (const item of items) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const result = await processQueueItem(item, idMap, quizId)

            if (result.status === "success") {
                succeededIds.add(item.id)
                if (item.op === "create" && item.questionId && result.createdId) {
                    idMap[item.questionId] = result.createdId
                }
                if (
                    (item.op === "create" || item.op === "update") &&
                    item.questionId &&
                    result.optionIds
                ) {
                    optionIdsByQuestion[item.questionId] = result.optionIds
                }
            } else {
                failed.push({
                    itemId: item.id,
                    error: result.reason,
                })
            }
        } catch (e) {
            failed.push({
                itemId: item.id,
                error: e instanceof Error ? e.message : String(e),
            })
        }
    }
    return { idMap, optionIdsByQuestion, succeededIds, failed }
}

export function sortQueue(queue: QueueItem[]): QueueItem[] {
    return [...queue].sort((a, b) => {
        const order: Record<QueueItem["op"], number> = {
            delete: 0,
            create: 1,
            update: 2,
            reorder: 3,
        }
        return (order[a.op] ?? 99) - (order[b.op] ?? 99)
    })
}
