import { apiPost, apiGet, apiDelete } from "@/api/client"
import type { Quiz } from "@/api/quiz"

export interface CreateSessionInput {
    quiz: string
}

export interface Session {
    code: string
    quizId: string
    created?: string
}

export function getSessionErrorMessage(error: Error | null | undefined): string | null {
    if (!error) return null
    return error.message || "The quiz session could not be started right now. Please try again."
}

export async function createSession(data: CreateSessionInput): Promise<Session> {
    return apiPost<Session>("/sessions", data)
}

export async function getSession(code: string): Promise<Session> {
    return apiGet<Session>(`/sessions/${code}`)
}

export async function deleteSession(code: string): Promise<void> {
    return apiDelete(`/sessions/${code}`)
}

export async function getSessionQuiz(code: string): Promise<Quiz> {
    return apiGet<Quiz>(`/sessions/${code}/quiz`)
}
