// frontend/src/api/getsSessionPlayers.ts

import { apiGet } from "@/shared/utils/client"
import type { SessionPlayer } from "@/features/session/types/session.ts"

export default async function getSessionPlayers(code: number): Promise<SessionPlayer[]> {
    return apiGet<SessionPlayer[]>(`/sessions/${code}/players`)
}
