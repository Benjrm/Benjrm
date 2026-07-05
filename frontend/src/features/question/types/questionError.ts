/** Client-side validation state for a question being edited in the quiz creator. */
export interface QuestionError {
    /** Whether the question text is empty. */
    missingQuestion: boolean
    /** Indices of answer options that are missing their text. */
    missingAnswers: number[]
    /** Whether a choice question has no option marked as correct. */
    missingCorrectAnswer: boolean
}
