import { useMemo } from "react"
import { createListStorage } from "@/utils/listStorage"
import type { ListStorage } from "@/utils/listStorage"
import type { QuestionApiResponse } from "@/api/questions/types/question.api"

export default function useQuestionStorage(): ListStorage<QuestionApiResponse> {
    return useMemo(() => createListStorage<QuestionApiResponse>("quiz:questions"), [])
}
