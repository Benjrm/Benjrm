import type { Question } from "@/features/question/types/questions.ts"

export default function updateOptionInQuestionAtIndex<
    Q extends Extract<Question, { options: unknown }>,
>(question: Q, index: number, updater: (option: Q["options"][number]) => Q["options"][number]): Q {
    return {
        ...question,
        options: question.options.map((option, i) => (i === index ? updater(option) : option)),
    }
}
