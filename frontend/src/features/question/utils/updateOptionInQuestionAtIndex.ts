import type { Question } from "@/features/question/types/questions.ts"

/**
 * Replaces a single option in a question's `options` array by index and
 * returns a new updated question object, leaving the original untouched.
 *
 * Note: assumes the question type actually has an `options` field; callers
 * must ensure type safety before calling (`SLIDE`-type questions are not handled).
 *
 * @template Q - A question type that includes an `options` array.
 * @param question - The question object to update.
 * @param index - Index of the option to replace.
 * @param updater - Produces the replacement option from the current one.
 */
export default function updateOptionInQuestionAtIndex<
    Q extends Extract<Question, { options: unknown }>,
>(question: Q, index: number, updater: (option: Q["options"][number]) => Q["options"][number]): Q {
    return {
        ...question,
        options: question.options.map((option, i) => (i === index ? updater(option) : option)),
    }
}
