import type { Question } from "@/features/question/types/questions.ts"

/**
 * Removes an option from a question by its index and returns a new updated question object.
 *
 * This function is generic over question types that contain an `options` array.
 * It creates an immutable update by returning a new object instead of mutating the original question.
 *
 * Note: This function assumes that the question type actually has an `options` field.
 * It does not handle `SLIDE`-type questions explicitly - callers must ensure type safety before calling.
 *
 * @template Q - A question type that includes an `options` array
 * @param question - The question object to update
 * @param indexToDelete - The index of the option to remove from the question's options array
 *
 * @returns A new question object with the specified option removed from its options array.
 */
export default function removeOptionFromQuestion<Q extends Extract<Question, { options: unknown }>>(
    question: Q,
    indexToDelete: number
): Q {
    return {
        ...question,
        options: question.options.filter((_, i) => i !== indexToDelete),
    }
}
