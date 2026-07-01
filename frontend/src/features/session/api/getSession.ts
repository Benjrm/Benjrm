import type { Session } from "@/features/session/types/session.ts"
import { apiGet } from "@/shared/utils/client.ts"

export default async function getSession(code: number): Promise<Session> {
    return apiGet<Session>(`/sessions/${code}`)
}
