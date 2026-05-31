import { useMemo } from "react"
import { createQuestionQueueStorage, type QuestionQueueStorage } from "@/api/questions/storage/questionQueueStorage.ts"

export default function useQuestionQueueStorage(): QuestionQueueStorage {
    return useMemo(() => createQuestionQueueStorage(), [])
}
