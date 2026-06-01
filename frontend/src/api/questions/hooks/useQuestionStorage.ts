import { useMemo } from "react"
import { createQuestionStorage } from "../storage/questionStorage"
import type { QuestionStorage } from "../storage/questionStorage"

export default function useQuestionStorage(): QuestionStorage {
    return useMemo(() => createQuestionStorage(), [])
}
