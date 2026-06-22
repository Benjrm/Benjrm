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
import { ApiError } from "@/api/utils.ts"
import QuestionQueueError from "@/queue/queue.error.ts"

async function processCreateOp<QI extends Extract<QueueItem, CreateQuestionQueueItem>>(
    item: QI,
    quizId: string
): Promise<ProcessResult> {
    const created = await questionAdapterImpl.createQuestion(quizId, item.payload)
    return { status: "success", createdId: created.id }
}

async function processUpdateOp<QI extends Extract<QueueItem, UpdateQuestionQueueItem>>(
    item: QI,
    quizId: string
): Promise<ProcessResult> {
    if (!item.questionId) return { status: "skipped", reason: "no_question_id" }

    if (String(item.questionId).startsWith("temp-")) {
        return { status: "skipped", reason: "unresolved_temp_id" }
    }

    await questionAdapterImpl.updateQuestion(quizId, item.questionId, item.payload)
    return { status: "success" }
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
    succeededIds: Set<string>
    failed: { itemId: string; error: string }[]
}> {
    const idMap: Record<string, string> = {}
    const succeededIds = new Set<string>()
    const failed: { itemId: string; error: string }[] = []

    // eslint-disable-next-line no-restricted-syntax
    for (const item of items) {
        try {
            if (
                (item.op === "update" || item.op === "delete") &&
                item.questionId &&
                idMap[item.questionId]
            ) {
                item.questionId = idMap[item.questionId]
            }

            // eslint-disable-next-line no-await-in-loop
            const result = await processQueueItem(item, idMap, quizId)

            if (result.status === "success") {
                succeededIds.add(item.id)
                if (item.op === "create" && item.questionId && result.createdId) {
                    idMap[item.questionId] = result.createdId
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
    return { idMap, succeededIds, failed }
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

export function normalizeError(err: unknown): QuestionQueueError {
    if (err instanceof QuestionQueueError) return err
    const apiError = err instanceof ApiError || err instanceof Error ? err : new Error(String(err))

    return new QuestionQueueError(undefined, apiError)
}
