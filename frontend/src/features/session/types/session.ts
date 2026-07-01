import type { QuestionType } from "@/features/question/types/questions.ts"

export interface CreateSessionInput {
    quiz: string
}

export interface Session {
    code: number
    isHost: boolean
    started: boolean
    quiz?: string
}

export interface SessionPlayer {
    id: string
    name: string
    emoji: string | null
}
export interface Player {
    id: string
    name: string
    emoji: string | null
}

export interface GameQuestion {
    id: string
    type: QuestionType
    text: string
    options: { id: string; text: string }[]
    seconds: number | null
}

export interface QuestionResult {
    correctAnswers: string[]
    points: number
    totalPoints: number
}

export interface LeaderboardEntry {
    id: string
    name: string
    emoji: string | null
    totalPoints: number
    points: number
}

export const GameStateEnum = {
    LOBBY: "lobby",
    PLAYING: "playing",
    QUESTION: "question",
    LEADERBOARD: "leaderboard",
    RESULT: "result",
} as const
export type GameState = (typeof GameStateEnum)[keyof typeof GameStateEnum]
