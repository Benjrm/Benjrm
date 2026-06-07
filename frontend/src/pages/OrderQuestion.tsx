// frontend/src/pages/OrderQuestion.tsx

import type { JSX } from "react"
import { useCallback, useState } from "react"
import { useSearchParams } from "react-router"

import OrderQuestionContent from "@/components/OrderQuestionContent"

export default function OrderQuestion(): JSX.Element {
    const [searchParams] = useSearchParams()
    const code = searchParams.get("code") ?? undefined
    const isMock = searchParams.get("mock") === "true"
    const [questionNumber, setQuestionNumber] = useState(0)

    const handleNextQuestion = useCallback(() => setQuestionNumber((n) => n + 1), [])

    return (
        <OrderQuestionContent
            code={code}
            isMock={isMock}
            onNextQuestion={handleNextQuestion}
            questionNumber={questionNumber}
        />
    )
}
