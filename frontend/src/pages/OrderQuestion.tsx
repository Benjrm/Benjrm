// frontend/src/pages/OrderQuestion.tsx

import type { JSX } from "react"
import { useSearchParams } from "react-router"

import OrderQuestionContent from "@/components/OrderQuestionContent"

export default function OrderQuestion(): JSX.Element {
    const [searchParams] = useSearchParams()
    const code = searchParams.get("code") ?? undefined
    const isMock = searchParams.get("mock") === "true"

    return <OrderQuestionContent code={code} isMock={isMock} />
}
