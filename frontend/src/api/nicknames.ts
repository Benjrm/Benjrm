import { apiGet } from "@/api/client"

export interface GenerateNameResponse {
    name: string
}

export async function getRandomNickname(): Promise<GenerateNameResponse> {
    return apiGet<GenerateNameResponse>("/nicknames/random")
}
