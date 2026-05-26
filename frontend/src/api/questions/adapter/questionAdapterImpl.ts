import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import QuestionMockAdapter from "@/api/questions/adapter/questionMockAdapter.ts"

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
}

const questionAdapterImpl = new QuestionAdapterImpl(new QuestionMockAdapter())
// TODO: Switch to API adapter when backend is ready
// const questionAdapterImpl = new QuestionAdapterImpl(new QuestionApiAdapter())
export default questionAdapterImpl
