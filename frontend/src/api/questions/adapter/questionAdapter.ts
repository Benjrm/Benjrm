import type { QuestionRequest, QuestionResponse } from "@/api/questions/types/question.api.new.ts"

export interface QuestionAdapter {
    createQuestion: (quizId: string, request: QuestionRequest) => Promise<QuestionResponse>
    getQuestions: (quizId: string) => Promise<QuestionResponse[]>
    getQuestion: (quizId: string, questionId: string) => Promise<QuestionResponse>
    updateQuestion: (
        quizId: string,
        questionId: string,
        request: Partial<QuestionRequest>
    ) => Promise<QuestionResponse>
    deleteQuestion: (quizId: string, questionId: string) => Promise<void>
    reorderQuestions: (quizId: string, order: string[]) => Promise<void>
}
