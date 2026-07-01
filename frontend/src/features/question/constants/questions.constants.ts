import type { QuestionType } from "@/features/question/types/questions.types.ts"

/**
 * List with all available question types.
 */
const questionTypes = [
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "SLIDE",
    "ORDER",
] as const satisfies readonly QuestionType[]

export default questionTypes
