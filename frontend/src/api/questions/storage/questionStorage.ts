import type { QuestionApiResponse } from "@/api/questions/types/question.api.ts"

export interface QuestionStorage {
    getQuestions: (quizId: string) => QuestionApiResponse[]
    setQuestions: (quizId: string, questions: QuestionApiResponse[]) => void
    deleteQuestions: (quizId: string) => void
}

function isBrowserAvailable(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function storageKey(quizId: string): string {
    return `quiz:${quizId}:questions`
}

function cloneQuestions(questions: QuestionApiResponse[]): QuestionApiResponse[] {
    return questions.map((question) => ({
        ...question,
        options: Array.isArray(question.options)
            ? question.options.map((option) => ({ ...option }))
            : question.options,
    }))
}

export function createQuestionStorage(): QuestionStorage {
    const memoryStore = new Map<string, QuestionApiResponse[]>()

    const readFromMemory = (quizId: string): QuestionApiResponse[] => {
        const questions = memoryStore.get(quizId) ?? []
        return cloneQuestions(questions)
    }

    return {
        getQuestions(quizId: string): QuestionApiResponse[] {
            if (!isBrowserAvailable()) {
                return readFromMemory(quizId)
            }

            try {
                const raw = localStorage.getItem(storageKey(quizId))
                if (!raw) return readFromMemory(quizId)

                const parsed = JSON.parse(raw) as QuestionApiResponse[]
                const questions = parsed ?? []
                memoryStore.set(quizId, cloneQuestions(questions))
                return cloneQuestions(questions)
            } catch {
                return readFromMemory(quizId)
            }
        },

        setQuestions(quizId: string, questions: QuestionApiResponse[]): void {
            const cloned = cloneQuestions(questions)
            memoryStore.set(quizId, cloned)

            if (!isBrowserAvailable()) return

            try {
                localStorage.setItem(storageKey(quizId), JSON.stringify(cloned))
            } catch {
                // keep the in-memory copy even if browser storage fails
            }
        },

        deleteQuestions(quizId: string): void {
            memoryStore.delete(quizId)

            if (!isBrowserAvailable()) return

            try {
                localStorage.removeItem(storageKey(quizId))
            } catch {
                // ignore storage failures
            }
        },
    }
}
