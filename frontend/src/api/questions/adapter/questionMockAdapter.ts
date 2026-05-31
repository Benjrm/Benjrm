import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import generateUuid from "@/utils/uuid"

export default class QuestionMockAdapter implements QuestionAdapter {
    private questionsByQuiz: Record<string, QuestionApiResponse[]> = {}

    private readonly storagePrefix = "benjrm:mock-questions:"

    private static isBrowserAvailable(): boolean {
        return typeof window !== "undefined" && typeof localStorage !== "undefined"
    }

    private storageKey(quizId: string): string {
        return `${this.storagePrefix}${quizId}`
    }

    private loadQuiz(quizId: string): QuestionApiResponse[] {
        if (this.questionsByQuiz[quizId]) {
            return this.questionsByQuiz[quizId]
        }

        if (!QuestionMockAdapter.isBrowserAvailable()) {
            this.questionsByQuiz[quizId] = []
            return this.questionsByQuiz[quizId]
        }

        try {
            const raw = localStorage.getItem(this.storageKey(quizId))

            if (!raw) {
                this.questionsByQuiz[quizId] = []
                return this.questionsByQuiz[quizId]
            }

            const parsed = JSON.parse(raw) as QuestionApiResponse[]
            this.questionsByQuiz[quizId] = parsed ?? []
            return this.questionsByQuiz[quizId]
        } catch {
            this.questionsByQuiz[quizId] = []
            return this.questionsByQuiz[quizId]
        }
    }

    private persistQuiz(quizId: string): void {
        if (!QuestionMockAdapter.isBrowserAvailable()) return

        try {
            localStorage.setItem(
                this.storageKey(quizId),
                JSON.stringify(this.questionsByQuiz[quizId] ?? [])
            )
        } catch {
            // ignore storage failures in mock mode
        }
    }

    async createQuestion(
        quizId: string,
        request: QuestionApiRequest
    ): Promise<QuestionApiResponse> {
        const questions = this.loadQuiz(quizId)
        const date = new Date().toISOString()
        const newQuestion: QuestionApiResponse = {
            id: generateUuid(),
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
        this.persistQuiz(quizId)
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
        this.questionsByQuiz[quizId] = questions
        this.persistQuiz(quizId)
        return Promise.resolve(updated)
    }

    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        const questions = this.loadQuiz(quizId)
        const idx = questions.findIndex((question) => question.id === questionId)
        if (idx === -1) throw new Error("Question not found")
        this.questionsByQuiz[quizId] = questions.filter((question) => question.id !== questionId)
        this.persistQuiz(quizId)
        return Promise.resolve()
    }
}
