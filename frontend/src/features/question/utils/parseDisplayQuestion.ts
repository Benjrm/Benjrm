import type { QuestionType } from "@/features/question/types/questions.ts"

import type { GameQuestion } from "@/features/session/types/session.ts"

/**
 * Converts the `DisplayQuestion`/`DisplayQuestionMessage` websocket payload
 * (backend's `question`/`answer` naming) into the frontend's {@link GameQuestion}
 * shape (`text`/`options[].text`) used by the game-session views.
 */
export default function parseDisplayQuestion(payload: {
    id: string
    question: string
    type: QuestionType
    options?: { id: string; answer: string }[]
    seconds?: number | null
}): GameQuestion {
    return {
        id: payload.id,
        type: payload.type,
        text: payload.question,
        options: (payload.options ?? []).map((opt) => ({ id: opt.id, text: opt.answer })),
        seconds: payload.seconds ?? null,
    }
}
