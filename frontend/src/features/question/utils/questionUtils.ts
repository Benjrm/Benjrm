import type { Question } from "@/features/question/types/questions.types.ts"

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
export function removeOptionFromQuestion<Q extends Extract<Question, { options: unknown }>>(
    question: Q,
    indexToDelete: number
): Q {
    return {
        ...question,
        options: question.options.filter((_, i) => i !== indexToDelete),
    }
}

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
export function addOptionToQuestion<Q extends Extract<Question, { options: unknown }>>(
    question: Q,
    option: Q["options"][number]
): Q {
    return {
        ...question,
        options: [...question.options, option],
    }
}

export function updateOptionInQuestionAtIndex<Q extends Extract<Question, { options: unknown }>>(
    question: Q,
    index: number,
    updater: (option: Q["options"][number]) => Q["options"][number]
): Q {
    return {
        ...question,
        options: question.options.map((option, i) => (i === index ? updater(option) : option)),
    }
}

export function updateQuestionWithPatch<Q extends Question>(
    question: Q,
    patch: Partial<Q>
): Question {
    return {
        ...question,
        ...patch,
    }
}
