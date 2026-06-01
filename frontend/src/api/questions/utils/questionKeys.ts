import { quizKeys } from "@/api/queries.ts"

const questionKeys = {
    key: "questions" as const,

    all: (quizId: string): string[] => [...quizKeys.all, quizId, questionKeys.key],
}
export default questionKeys
