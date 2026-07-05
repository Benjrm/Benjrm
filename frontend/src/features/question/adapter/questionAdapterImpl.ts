import type { QuestionAdapter } from "@/features/question/adapter/questionAdapter.ts"
import QuestionApiAdapter from "@/features/question/api/questionApiAdapter.ts"
import type {
    Question,
    QuestionRequest,
    UpdateQuestionRequest,
} from "@/features/question/types/questions.ts"

/**
 * {@link QuestionAdapter} that delegates every call to an injected
 * implementation. Exists so the app can swap the underlying implementation
 * (real API vs. a mock) without changing the call sites.
 */
class QuestionAdapterImpl implements QuestionAdapter {
    private readonly service: QuestionAdapter

    constructor(service: QuestionAdapter) {
        this.service = service
    }

    async createQuestion(quizId: string, request: QuestionRequest): Promise<Question> {
        return this.service.createQuestion(quizId, request)
    }

    async getQuestions(quizId: string): Promise<Question[]> {
        return this.service.getQuestions(quizId)
    }

    async getQuestion(quizId: string, questionId: string): Promise<Question> {
        return this.service.getQuestion(quizId, questionId)
    }

    async updateQuestion(
        quizId: string,
        questionId: string,
        request: Partial<UpdateQuestionRequest>
    ): Promise<Question> {
        return this.service.updateQuestion(quizId, questionId, request)
    }

    async deleteQuestion(quizId: string, questionId: string): Promise<void> {
        return this.service.deleteQuestion(quizId, questionId)
    }

    async reorderQuestions(quizId: string, order: string[]): Promise<void> {
        return this.service.reorderQuestions(quizId, order)
    }
}

/**
 * App-wide {@link QuestionAdapter} instance, backed by the real API by
 * default. If you need to fall back to a mock adapter for offline/dev, create
 * the instance here and pass it instead.
 */
const questionAdapterImpl = new QuestionAdapterImpl(new QuestionApiAdapter())
export default questionAdapterImpl
