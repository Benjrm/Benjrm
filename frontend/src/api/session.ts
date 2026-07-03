// frontend/src/api/session.ts

import { apiPost, apiGet, apiDelete } from "@/api/client"
import toQuiz from "@/api/quizzes/quizzes.mapper.ts"
import type { Quiz, QuizDto } from "@/api/quizzes/quizzes.types.ts"

export interface CreateSessionInput {
    quiz: string
}

export interface Session {
    code: number
    isHost: boolean
    started: boolean
    quiz?: string
}

export interface SessionPlayer {
    id: string
    name: string
    emoji: string | null
}

export function getSessionErrorMessage(error: Error | null | undefined): string | null {
    if (!error) return null
    return error.message || "The quiz session could not be started right now. Please try again."
}

export async function createSession(data: CreateSessionInput): Promise<Session> {
    return apiPost<Session>("/sessions", data)
}

export async function getSession(code: number): Promise<Session> {
    return apiGet<Session>(`/sessions/${code}`)
}

export async function deleteSession(code: number): Promise<void> {
    return apiDelete(`/sessions/${code}`)
}

export async function getSessionQuiz(code: number): Promise<Quiz> {
    const dto = await apiGet<QuizDto>(`/sessions/${code}/quiz`)
    return toQuiz(dto)
}

export async function getSessionPlayers(code: number): Promise<SessionPlayer[]> {
    return apiGet<SessionPlayer[]>(`/sessions/${code}/players`)
}
