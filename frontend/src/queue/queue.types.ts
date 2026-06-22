import type { QuestionRequest } from "@/api/questions/questions.types.ts"

/**
 * Base structure for all queue items.
 * Represents a persisted operation that will be processed later (e.g. synced with the backend).
 */
interface BaseQueueItem {
    /**
     * Uniquely identifies the queue item.
     * Used to track which items have been processed successfully and which have not,
     * so we can remove only the successful ones from the queue after a flush.
     */
    id: string
}

/**
 * Queue item representing the creation of a new question.
 */
export interface CreateQuestionQueueItem extends BaseQueueItem {
    /**
     * The type of the queue operation.
     * Defines that this item creates a new question.
     */
    op: "create"
    /**
     * The full data required to create a question.
     */
    payload: QuestionRequest

    /**
     * The unique question uuid v4 identifier.
     * In case of create operations, this may be a temporary client-side generated id.
     * Note: Temporary client-side generated IDs starts with "temp-" prefix to distinguish them from real backend-generated IDs.
     */
    questionId: string
}

/**
 * Queue item representing an update to an existing question.
 */
export interface UpdateQuestionQueueItem extends BaseQueueItem {
    /**
     * The type of the queue operation.
     * Defines that this item updates an existing question.
     */
    op: "update"
    /**
     * The full data required to update a question
     */
    payload: QuestionRequest

    /**
     * The unique, server-side generated question uuid v4 identifier.
     */
    questionId: string
}

/**
 * Queue item representing deletion of a question.
 */
export interface DeleteQuestionQueueItem extends BaseQueueItem {
    /**
     * The type of the queue operation.
     * Defines that this item deletes an existing question.
     */
    op: "delete"

    /**
     * The unique, server-side generated question uuid v4 identifier.
     */
    questionId: string
}

/**
 * Queue item representing reordering of questions within a quiz.
 */
export interface ReorderQueueItem extends BaseQueueItem {
    /**
     * The type of the queue operation.
     * Defines that this item reorders the questions within a quiz.
     */
    op: "reorder"
    /**
     * New ordering of question IDs.
     */
    payload: {
        order: string[]
    }
}

/**
 * Union type of all supported queue operations.
 */
export type QueueItem =
    | CreateQuestionQueueItem
    | UpdateQuestionQueueItem
    | DeleteQuestionQueueItem
    | ReorderQueueItem

/**
 * Actions used to manipulate the local queue state (e.g. reducer actions).
 */
export type Action =
    | { type: "clear" }
    | { type: "replace"; items: QueueItem[] }
    | {
          type: "upsertCreate"
          questionId: string
          payload: QuestionRequest
      }
    | { type: "upsertReorder"; order: string[] }
    | {
          type: "upsertUpdate"
          questionId: string
          payload: QuestionRequest
      }
    | {
          type: "upsertDelete"
          questionId: string
      }

/**
 * Result of processing a queue item.
 */
export type ProcessResult =
    | { status: "success"; createdId?: string }
    | { status: "skipped"; reason: string }
