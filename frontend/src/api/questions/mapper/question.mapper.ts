import type {
    Question,
    QuestionRequest,
    QuestionResponse,
} from "@/api/questions/types/question.api.new.ts"

export default function toQuestion(dto: QuestionResponse): Question {
    return {
        ...dto,
        created: new Date(dto.created),
        modified: new Date(dto.modified),
    }
}

function assertNever(x: never): never {
    throw new Error(`Unsupported question type: ${JSON.stringify(x)}`)
}

export function toQuestionRequest(question: Question): QuestionRequest {
    const base = {
        question: question.question,
        hidden: question.hidden,
    }
    switch (question.type) {
        case "SLIDE":
            return {
                ...base,
                type: "SLIDE",
            }
        case "ORDER":
            return {
                ...base,
                type: "ORDER",
                options: question.options.map((opt) => ({
                    answer: opt.answer,
                })),
            }
        case "SINGLE_CHOICE":
        case "MULTIPLE_CHOICE":
            return {
                ...base,
                type: question.type,
                options: question.options.map((opt) => ({
                    answer: opt.answer,
                    correct: opt.correct,
                })),
            }
        default:
            return assertNever(question)
    }
}
