import type { Question } from "@/features/question/types/questions.ts"

/**
 * Adds and option to the end of a question's options array and returns a new updated question object.
 *
 * Note: This function assumes that the question type actually has an `options` field.
 * It does not handle `SLIDE`-type questions explicitly - callers must ensure type safety before calling.
 *
 * @template Q - A question type that includes an `options` array
 *
 * @template Q - A question type that includes an `options` array
 * @param question - The question object to update
 * @param option - The option to add to the question's options array
 *
 * @returns A new question object with the specified option added to the end of its options array.
 */
export default function addOptionToQuestion<Q extends Extract<Question, { options: unknown }>>(
    question: Q,
    option: Q["options"][number]
): Q {
    return {
        ...question,
        options: [...question.options, option],
    }
}
