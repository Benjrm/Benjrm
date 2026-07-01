import type { CreateSessionInput, Session } from "@/features/session/types/session.ts"
import { apiPost } from "@/shared/utils/client.ts"

export default async function createSession(data: CreateSessionInput): Promise<Session> {
    return apiPost<Session>("/sessions", data)
}
