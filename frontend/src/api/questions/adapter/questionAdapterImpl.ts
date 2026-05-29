import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import QuestionMockAdapter from "@/api/questions/adapter/questionMockAdapter.ts"
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

function createQuestionAdapter(): QuestionAdapter {
    const adapterType = import.meta.env.VITE_QUESTION_ADAPTER ?? "mock"

    if (adapterType === "api") {
        return new QuestionApiAdapter()
    }

    return new QuestionMockAdapter()
}

const questionAdapterImpl = new QuestionAdapterImpl(createQuestionAdapter())
export default questionAdapterImpl
