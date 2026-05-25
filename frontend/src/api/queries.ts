// frontend/src/api/queries.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query"

import { getQuiz, getQuizzes, createQuiz, updateQuiz, deleteQuiz } from "@/api/quiz"
import type { CreateQuizInput, Quiz } from "@/api/quiz"
import deleteQuestion from "@/api/question.ts"

// Query Keys
export const quizKeys = {
    all: ["quizzes"] as const,
    lists: () => [...quizKeys.all, "list"] as const,
    details: () => [...quizKeys.all, "detail"] as const,
    detail: (id: string) => [...quizKeys.details(), id] as const,
}

export const questionKeys = {
    key: "questions" as const,

    // [quizzes, quizId, questions]
    all: (quizId: string): string[] => [...quizKeys.all, quizId, questionKeys.key],

    // [quizzes, quizId, questions, questionId]
    detail: (quizId: string, questionId: string): string[] => [
        ...questionKeys.all(quizId),
        questionId,
    ],
}

// ============ QUERIES ============

export function useQuiz(quizId: string | undefined): UseQueryResult<Quiz> {
    return useQuery({
        queryKey: quizId ? quizKeys.detail(quizId) : [],
        queryFn: async (): Promise<Quiz> => {
            if (!quizId) throw new Error("No quiz ID")
            return getQuiz(quizId)
        },
        enabled: !!quizId,
    })
}

export function useQuizzes(): UseQueryResult<Quiz[]> {
    return useQuery({
        queryKey: quizKeys.lists(),
        queryFn: async (): Promise<Quiz[]> => getQuizzes(),
    })
}

// ============ MUTATIONS ============

export function useCreateQuiz(): UseMutationResult<Quiz, Error, CreateQuizInput> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateQuizInput): Promise<Quiz> => createQuiz(data),
        onSuccess: (quiz) => {
            queryClient.setQueryData(quizKeys.detail(quiz.id), quiz)
            queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
        },
    })
}

export function useUpdateQuiz(
    quizId: string | undefined
): UseMutationResult<Quiz, Error, CreateQuizInput> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateQuizInput): Promise<Quiz> => {
            if (!quizId) throw new Error("No quiz ID")
            return updateQuiz(quizId, data)
        },
        onSuccess: (quiz) => {
            if (quizId) {
                queryClient.setQueryData(quizKeys.detail(quizId), quiz)
                queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
            }
        },
    })
}

export function useDeleteQuiz(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (quizId: string): Promise<void> => deleteQuiz(quizId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
        },
    })
}

/**
 * DELETE /api/v1/quizzes/{quizId}/questions/{questionId}
 * @param quizId The quiz id the question belongs to.
 */
export function useDeleteQuestion(quizId?: string): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (questionId: string): Promise<void> => {
            if (!quizId)
                throw new Error(
                    `DELETE /api/v1/quizzes/{quizId}/questions/{questionId} requires quizId and questionId, given quizId=${quizId}; questionId=${questionId}`
                )
            return deleteQuestion(quizId, questionId)
        },
        onSuccess: async () => {
            if (quizId) {
                return queryClient.invalidateQueries({ queryKey: questionKeys.all(quizId) })
            }
        },
    })
}
