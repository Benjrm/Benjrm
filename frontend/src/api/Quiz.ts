// frontend/src/api/Quiz.ts

import { apiGet, apiPost, apiPatch, apiDelete } from "@/api/Client.ts"

export interface CreateQuizInput {
    title: string
    description?: string
    hidden?: boolean
}

export interface Quiz {
    id: string
    title: string
    description?: string | null
    hidden: false
    created: Date
    modified: Date
}

export interface QuizList {
    quizzes: Quiz[]
}

export async function createQuiz(data: CreateQuizInput): Promise<Quiz> {
    return apiPost<Quiz>("/quizzes", data)
}

export async function updateQuiz(quizId: string, data: CreateQuizInput): Promise<Quiz> {
    return apiPatch<Quiz>(`/quizzes/${quizId}`, data)
}

export async function getQuizzes(): Promise<Quiz[]> {
    return apiGet<Quiz[]>("/quizzes")
}

export async function getQuiz(quizId: string): Promise<Quiz> {
    return apiGet<Quiz>(`/quizzes/${quizId}`)
}

export async function deleteQuiz(quizId: string): Promise<void> {
    return apiDelete(`/quizzes/${quizId}`)
}
