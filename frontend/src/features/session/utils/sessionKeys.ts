// frontend/src/api/session/keys.ts

/**
 * Key object for React Query.
 * Used for caching API responses.
 */
const sessionKeys = {
    all: ["sessions"] as const,
    detail: (code: number) => [...sessionKeys.all, code] as const,
    quiz: (code: number) => [...sessionKeys.detail(code), "quiz"] as const,
    players: (code: number) => [...sessionKeys.detail(code), "players"] as const,
} as const

export default sessionKeys
