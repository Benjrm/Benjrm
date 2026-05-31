import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import { createQuestionStorage, type QuestionStorage } from "@/api/questions/storage/questionStorage.ts"

export default class QuestionMockAdapter implements QuestionAdapter {
    private questionsByQuiz: Record<string, QuestionApiResponse[]> = {}

    private readonly storage: QuestionStorage

    constructor(storage: QuestionStorage = createQuestionStorage()) {
        this.storage = storage
    }

    private loadQuiz(quizId: string): QuestionApiResponse[] {
        if (this.questionsByQuiz[quizId]) {
            return this.questionsByQuiz[quizId]
        }

        const loaded = this.storage.getQuestions(quizId)
        this.questionsByQuiz[quizId] = loaded
        return this.questionsByQuiz[quizId]
    }

    async createQuestion(
        quizId: string,
        request: QuestionApiRequest
    ): Promise<QuestionApiResponse> {
        const questions = this.loadQuiz(quizId)
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
        questions.push(newQuestion)
        this.questionsByQuiz[quizId] = questions
        this.storage.setQuestions(quizId, questions)
        return Promise.resolve(newQuestion)
    }

    async getQuestions(quizId: string): Promise<QuestionApiResponse[]> {
        return Promise.resolve(this.loadQuiz(quizId))
    }

    async updateQuestion(
        quizId: string,
        questionId: string,
        request: Partial<QuestionApiRequest>
    ): Promise<QuestionApiResponse> {
        const questions = this.loadQuiz(quizId)
        const idx = questions.findIndex((q) => q.id === questionId)
        if (idx === -1) throw new Error("Question not found")
        const prev = questions[idx]
        const prevOptions = prev.options ?? []
        const updatedOptions = request.options
            ? request.options.map((opt, i) => ({
                  ...prevOptions[i],
                  ...opt,
                  id: prevOptions[i].id ?? crypto.randomUUID(),
              }))
            : prev.options

        const updated = {
            ...prev,
            ...request,
            options: updatedOptions,
            modified: new Date().toISOString(),
        }
        questions[idx] = updated
        this.questionsByQuiz[quizId] = questions
        this.storage.setQuestions(quizId, questions)
        return Promise.resolve(updated)
    }

    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        const questions = this.loadQuiz(quizId)
        const idx = questions.findIndex((question) => question.id === questionId)
        if (idx === -1) throw new Error("Question not found")
        this.questionsByQuiz[quizId] = questions.filter((question) => question.id !== questionId)
        this.storage.setQuestions(quizId, this.questionsByQuiz[quizId])
        return Promise.resolve()
    }

    async reorderQuestions(quizId: string, order: string[]): Promise<void> {
        const questions = this.loadQuiz(quizId)
        const map = new Map(questions.map((question) => [question.id, question]))
        const reordered = order.map((id) => map.get(id)).filter(Boolean) as QuestionApiResponse[]
        const missing = questions.filter((question) => !order.includes(question.id))
        this.questionsByQuiz[quizId] = [...reordered, ...missing]
        this.storage.setQuestions(quizId, this.questionsByQuiz[quizId])
        return Promise.resolve()
    }
}
