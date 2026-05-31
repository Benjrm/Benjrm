import { useMemo } from "react"
import { createQuestionStorage, type QuestionStorage } from "../storage/questionStorage"

export default function useQuestionStorage(): QuestionStorage {
    return useMemo(() => createQuestionStorage(), [])
}
