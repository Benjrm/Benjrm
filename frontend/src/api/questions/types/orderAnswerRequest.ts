import type { Identifier } from "@/api/utils.ts"

export interface OrderAnswerRequest {
    id?: string | null
    answer: string
}

export interface OrderAnswerResponse extends Omit<OrderAnswerRequest, "id">, Identifier {}
