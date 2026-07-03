const quizKeys = {
    all: ["quizzes"] as const,
    lists: () => [...quizKeys.all, "list"] as const,
    details: () => [...quizKeys.all, "detail"] as const,
    detail: (id: string) => [...quizKeys.details(), id] as const,
}
export default quizKeys
