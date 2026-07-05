import type { Question } from "@/features/question/types/questions.ts"

/**
 * Shallow-merges `patch` into `question`, returning a new question object.
 *
 * Note: this does not validate that the patch keeps the discriminated union
 * consistent (e.g. changing `type` without updating `options`) — callers are
 * responsible for passing a coherent patch.
 */
export default function updateQuestionWithPatch<Q extends Question>(
    question: Q,
    patch: Partial<Q>
): Question {
    return {
        ...question,
        ...patch,
    }
}
