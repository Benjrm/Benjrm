import { apiDelete } from "@/shared/utils/client.ts"

export default async function deleteSession(code: number): Promise<void> {
    return apiDelete(`/sessions/${code}`)
}
