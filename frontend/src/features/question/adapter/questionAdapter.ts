import type {
    Question,
    QuestionRequest,
    UpdateQuestionRequest,
} from "@/features/question/types/questions.ts"

/**
 * {@link https://en.wikipedia.org/wiki/Adapter_pattern Adapter pattern} for the question's api.
 */
export interface QuestionAdapter {
    /**
     * Creates a new question inside a quiz
     * @param quizId the id of the quiz the question should be created in
     * @param request the question request containing the question data
     */
    createQuestion: (quizId: string, request: QuestionRequest) => Promise<Question>

    /**
     * Retrieves all questions for a specific quiz.
     * @param quizId the id of the quiz to retrieve questions for
     * @returns a promise that resolves to an array of questions belonging to the specified quiz
     */
    getQuestions: (quizId: string) => Promise<Question[]>

    /**
     * Retrieves a single question by its ID within a quiz.
     * @param quizId the id of the quiz the questions belongs to.
     * @param questionId the id of the question to retrieve
     * @returns a promise that resolves to the question with the specified ID
     */
    getQuestion: (quizId: string, questionId: string) => Promise<Question>

    /**
     * Updates a existing question.
     * Accepts a partial request to allow updating only specific fields of the question.
     * @param quizId the id of the quiz the question belongs to.
     * @param questionId the id of the question to update
     * @param request a partial question request containing the fields to update
     * @returns a promise that resolves to the updated question
     */
    updateQuestion: (
        quizId: string,
        questionId: string,
        request: Partial<UpdateQuestionRequest>
    ) => Promise<Question>
    /**
     * Deletes a question from a quiz.
     * @param quizId the id of the quiz the question belongs to.
     * @param  questionId the id of the question to delete
     */
    deleteQuestion: (quizId: string, questionId: string) => Promise<void>

    /**
     * Reorders questions within a quiz using and ordered list of question ids.
     * @param quizId the id of the quiz the questions belongs to.
     * @param order an array of question ids representing the new order of the questions in the quiz
     */
    reorderQuestions: (quizId: string, order: string[]) => Promise<void>
}
