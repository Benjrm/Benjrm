import { quizKeys } from "@/api/queries.ts"

const questionKeys = {
    key: "questions" as const,

    // [quizzes, quizId, questions]
    all: (quizId: string): string[] => [...quizKeys.all, quizId, questionKeys.key],
}
export default questionKeys
