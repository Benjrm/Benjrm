import type { Question } from "@/features/question/types/questions.ts"
import tempId from "@/shared/utils/tempId.ts"

export default function createEmptyQuestion(): Question {
    return {
        id: tempId(),
        question: "",
        created: new Date(),
        modified: new Date(),
        type: "SINGLE_CHOICE",
        options: [
            { id: tempId(), answer: "", correct: false },
            { id: tempId(), answer: "", correct: false },
        ],
        hidden: false,
    }
}
