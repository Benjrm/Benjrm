// frontend/src/api/Queries.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query"

import { getQuiz, getQuizzes, createQuiz, updateQuiz, deleteQuiz } from "@/api/Quiz"
import type { CreateQuizInput, Quiz } from "@/api/Quiz"

// Query Keys
export const quizKeys = {
    all: ["quizzes"] as const,
    lists: () => [...quizKeys.all, "list"] as const,
    details: () => [...quizKeys.all, "detail"] as const,
    detail: (id: string) => [...quizKeys.details(), id] as const,
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
