import type {
    Question,
    QuestionRequest,
} from "@/api/questions/types/question.api.new.ts"

export interface QuestionAdapter {
    createQuestion: (quizId: string, request: QuestionRequest) => Promise<Question>
    getQuestions: (quizId: string) => Promise<Question[]>
    getQuestion: (quizId: string, questionId: string) => Promise<Question>
    updateQuestion: (
        quizId: string,
        questionId: string,
        request: Partial<QuestionRequest>
    ) => Promise<Question>
    deleteQuestion: (quizId: string, questionId: string) => Promise<void>
    reorderQuestions: (quizId: string, order: string[]) => Promise<void>
}
