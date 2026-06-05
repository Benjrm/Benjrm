import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"

export interface QuestionAdapter {
    createQuestion: (quizId: string, request: QuestionApiRequest) => Promise<QuestionApiResponse>
    getQuestions: (quizId: string) => Promise<QuestionApiResponse[]>
    updateQuestion: (
        quizId: string,
        questionId: string,
        request: Partial<QuestionApiRequest>
    ) => Promise<QuestionApiResponse>
    deleteQuestion: (quizId: string, questionId: string) => Promise<void>
}
