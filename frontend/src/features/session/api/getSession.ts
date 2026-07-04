import type { Session } from "@/features/session/types/session.ts"
import { apiGet } from "@/shared/utils/apiClient.ts"

/** Fetches a game session by its join code (`GET /sessions/{code}`). */
export default async function getSession(code: number): Promise<Session> {
    return apiGet<Session>(`/sessions/${code}`)
}
