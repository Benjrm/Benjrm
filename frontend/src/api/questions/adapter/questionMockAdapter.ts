import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"

export default class QuestionMockAdapter implements QuestionAdapter {
    private questionsByQuiz: Record<string, QuestionApiResponse[]> = {}

    async createQuestion(
        quizId: string,
        request: QuestionApiRequest
    ): Promise<QuestionApiResponse> {
        const date = new Date().toISOString()
        const newQuestion: QuestionApiResponse = {
            id: crypto.randomUUID(),
            ...request,
            created: date,
            modified: date,
            options: request.options?.map((option) => ({
                ...option,
                id: crypto.randomUUID(),
            })),
        }
        if (!this.questionsByQuiz[quizId]) {
            this.questionsByQuiz[quizId] = []
        }
        this.questionsByQuiz[quizId].push(newQuestion)
        return Promise.resolve(newQuestion)
    }

    async getQuestions(quizId: string): Promise<QuestionApiResponse[]> {
        return Promise.resolve(this.questionsByQuiz[quizId] ?? [])
    }

    async updateQuestion(
        quizId: string,
        questionId: string,
        request: Partial<QuestionApiRequest>
    ): Promise<QuestionApiResponse> {
        const questions = this.questionsByQuiz[quizId] ?? []
        const idx = questions.findIndex((q) => q.id === questionId)
        if (idx === -1) throw new Error("Question not found")
        const prev = questions[idx]
        const updatedOptions = request.options
            ? request.options.map((opt, i) => ({
                  ...prev.options[i],
                  ...opt,
                  modified: new Date().toISOString(),
              }))
            : prev.options

        const updated = {
            ...prev,
            ...request,
            options: updatedOptions,
            modified: new Date().toISOString(),
        }
        questions[idx] = updated
        return Promise.resolve(updated)
    }

    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        const questions = this.questionsByQuiz[quizId] ?? []
        const idx = questions.findIndex((question) => question.id === questionId)
        if (idx === -1) throw new Error("Question not found")
        this.questionsByQuiz[quizId] = questions.filter((question) => question.id !== questionId)
        return Promise.resolve()
    }
}
