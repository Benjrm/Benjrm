/**
 * @deprecated
 */
export const QuestionTypeEnum = {
    SINGLE_CHOICE: "SINGLE_CHOICE",
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    SLIDE: "SLIDE",
    ORDER: "ORDER",
} as const

/**
 * @deprecated
 */
export type QuestionType = (typeof QuestionTypeEnum)[keyof typeof QuestionTypeEnum]
