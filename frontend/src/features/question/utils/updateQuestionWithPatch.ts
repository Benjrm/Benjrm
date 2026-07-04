import type { Question } from "@/features/question/types/questions.ts"

export default function updateQuestionWithPatch<Q extends Question>(
    question: Q,
    patch: Partial<Q>
): Question {
    return {
        ...question,
        ...patch,
    }
}
