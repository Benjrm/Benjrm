import type { QuestionAdapter } from "@/api/questions/adapter/questionAdapter.ts"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api/client.ts"
import type {
    Question,
    QuestionRequest,
    QuestionResponse,
} from "@/api/questions/types/question.api.new.ts"
import toQuestion from "@/api/questions/mapper/question.mapper.ts"

export default class QuestionApiAdapter implements QuestionAdapter {
    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async createQuestion(quizId: string, request: QuestionRequest): Promise<Question> {
        const dto = await apiPost<QuestionResponse>(`/quizzes/${quizId}/questions`, request)
        return toQuestion(dto)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        return apiDelete(`/quizzes/${quizId}/questions/${questionId}`)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async getQuestions(quizId: string): Promise<Question[]> {
        const dtos = await apiGet<QuestionResponse[]>(`/quizzes/${quizId}/questions`)
        return dtos.map(toQuestion)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async getQuestion(quizId: string, questionId: string): Promise<Question> {
        const dto = await apiGet<QuestionResponse>(`/quizzes/${quizId}/questions/${questionId}`)
        return toQuestion(dto)
    }

    // because the QuestionAdapterImpl calls this method on instance, we cannot make it static, even though it does not use any instance properties
    // eslint-disable-next-line class-methods-use-this
    async updateQuestion(
        quizId: string,
        questionId: string,
        request: Partial<QuestionRequest>
    ): Promise<Question> {
        const dto = await apiPatch<QuestionResponse>(
            `/quizzes/${quizId}/questions/${questionId}`,
            request
        )
        return toQuestion(dto)
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
