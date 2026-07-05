import type { CreateSessionInput, Session } from "@/features/session/types/session.ts"
import { apiPost } from "@/shared/utils/apiClient.ts"

/** Creates a new game session, optionally bound to a quiz (`POST /sessions`). */
export default async function createSession(data: CreateSessionInput): Promise<Session> {
    return apiPost<Session>("/sessions", data)
}
