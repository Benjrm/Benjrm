const sessionKeys = {
    all: ["sessions"] as const,
    detail: (code: string) => [...sessionKeys.all, code] as const,
    quiz: (code: string) => [...sessionKeys.detail(code), "quiz"] as const,
} as const

export default sessionKeys
