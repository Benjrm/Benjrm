import type { Identifier } from "@/api/utils.ts"

/**
 * @deprecated
 */
export interface OrderAnswerRequest {
    id?: string | null
    answer: string
}

/**
 * @deprecated
 */
export interface OrderAnswerResponse extends Omit<OrderAnswerRequest, "id">, Identifier {}
