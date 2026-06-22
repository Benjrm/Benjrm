// frontend/src/api/queries.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query"
import useQuestionQueueStorage from "@/api/questions/hooks/useQuestionQueueStorage"
import type { NewQuiz, Quiz, UpdateQuiz } from "@/api/quizzes/quizzes.types.ts"
import {
    createQuiz,
    deleteQuiz,
    getQuiz,
    getQuizzes,
    updateQuiz,
} from "@/api/quizzes/quizzes.api.ts"

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

export function useCreateQuiz(): UseMutationResult<Quiz, Error, NewQuiz> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: NewQuiz): Promise<Quiz> => createQuiz(data),
        onSuccess: (quiz) => {
            queryClient.setQueryData(quizKeys.detail(quiz.id), quiz)
            queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
        },
    })
}

export function useUpdateQuiz(
    quizId: string | undefined
): UseMutationResult<Quiz, Error, UpdateQuiz> {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: UpdateQuiz): Promise<Quiz> => {
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
    const queueStorage = useQuestionQueueStorage()
    return useMutation({
        mutationFn: async (quizId: string): Promise<void> => deleteQuiz(quizId),
        onSuccess: (_data, quizId) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
            queueStorage.delete(quizId)
        },
    })
}
