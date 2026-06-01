import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import QuestionApiAdapter from "@/api/questions/adapter/questionApiAdapter.ts"

class QuestionAdapterImpl implements QuestionAdapter {
    private service: QuestionAdapter

    constructor(service: QuestionAdapter) {
        this.service = service
    }

    async createQuestion(
        quizId: string,
        request: QuestionApiRequest
    ): Promise<QuestionApiResponse> {
        return this.service.createQuestion(quizId, request)
    }

    async getQuestions(quizId: string): Promise<QuestionApiResponse[]> {
        return this.service.getQuestions(quizId)
    }

    async getQuestion(quizId: string, questionId: string): Promise<QuestionApiResponse> {
        return this.service.getQuestion(quizId, questionId)
    }

    async updateQuestion(
        quizId: string,
        questionId: string,
        request: Partial<QuestionApiRequest>
    ): Promise<QuestionApiResponse> {
        return this.service.updateQuestion(quizId, questionId, request)
    }

    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        return this.service.deleteQuestion(quizId, questionId)
    }

    async reorderQuestions(quizId: string, order: string[]): Promise<void> {
        return this.service.reorderQuestions(quizId, order)
    }
}

// Use the real API adapter by default (replace mock)
const questionAdapterImpl = new QuestionAdapterImpl(new QuestionApiAdapter())
// If you need to fall back to the mock adapter for offline/dev, create the instance here and pass it instead.
export default questionAdapterImpl
