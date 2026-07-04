import quizKeys from "@/features/quiz/utils/quizKeys.ts"

/** TanStack Query key factory for question-related queries, namespaced under the owning quiz's key. */
const questionKeys = {
    key: "questions" as const,

    /** Query key for all questions belonging to the quiz with the given id. */
    all: (quizId: string): string[] => [...quizKeys.all, quizId, questionKeys.key],
}
export default questionKeys
