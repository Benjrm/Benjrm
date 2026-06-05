import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import type { QuestionApiRequest, QuestionApiResponse } from "@/api/questions/types/question.api.ts"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api/client.ts"

export default class QuestionApiAdapter implements QuestionAdapter {
    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async createQuestion(
        quizId: string,
        request: QuestionApiRequest
    ): Promise<QuestionApiResponse> {
        return apiPost<QuestionApiResponse>(`/quizzes/${quizId}/questions`, request)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        return apiDelete(`/quizzes/${quizId}/questions/${questionId}`)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async getQuestions(quizId: string): Promise<QuestionApiResponse[]> {
        return apiGet(`/quizzes/${quizId}/questions`)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async getQuestion(quizId: string, questionId: string): Promise<QuestionApiResponse> {
        return apiGet(`/quizzes/${quizId}/questions/${questionId}`)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async updateQuestion(
        quizId: string,
        questionId: string,
        request: Partial<QuestionApiRequest>
    ): Promise<QuestionApiResponse> {
        return apiPatch(`/quizzes/${quizId}/questions/${questionId}`, request)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async reorderQuestions(quizId: string, order: string[]): Promise<void> {
        if (order.length === 0) {
            return
        }

        for (let i = 0; i < order.length; i += 1) {
            const id = order[i]
            const prev = i > 0 ? order[i - 1] : null
            const next = i < order.length - 1 ? order[i + 1] : null
            // disable eslint for this line because we need to ensure that the requests are sent in order, and sending them in parallel could
            // will be altered in a later PR to use a more efficient approach, but for now this is the simplest way to ensure correct ordering without making assumptions about the backend implementation
            // eslint-disable-next-line no-await-in-loop
            await apiPatch(`/quizzes/${quizId}/questions/${id}`, { prev, next })
        }
    }
}
