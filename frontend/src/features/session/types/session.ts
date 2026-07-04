import type { QuestionType } from "@/features/question/types/questions.ts"

/** Request payload to create a game session, optionally bound to a quiz. */
export interface CreateSessionInput {
    quiz: string
}

/** A game session as returned by the REST API (`GET /sessions/{code}`). */
export interface Session {
    code: number
    /** Whether the current user is the host of this session. */
    isHost: boolean
    started: boolean
    quiz?: string
}

/** A player connected to a game session, as broadcast to the host over the websocket. */
export interface SessionPlayer {
    id: string
    name: string
    emoji: string | null
}

/** A question as displayed to game-session clients (see `parseDisplayQuestion`); distinct from the quiz-editor `Question` model. */
export interface GameQuestion {
    id: string
    type: QuestionType
    text: string
    options: { id: string; text: string }[]
    /** Total time to answer in seconds, or `null` for untimed (e.g. slide) questions. */
    seconds: number | null
}

/** Per-player result for a finalized question, sent to a player over the websocket. */
export interface QuestionResult {
    correctAnswers: string[]
    /** Points earned for this question. */
    points: number
    /** Cumulative points across the session so far. */
    totalPoints: number
}

/** A single row of the game-session leaderboard/podium, as broadcast over the websocket. */
export interface LeaderboardEntry {
    id: string
    name: string
    emoji: string | null
    totalPoints: number
    points: number
}

/** High-level UI states a game-session client (host or player) can be in. */
export const GameStateEnum = {
    LOBBY: "lobby",
    PLAYING: "playing",
    QUESTION: "question",
    LEADERBOARD: "leaderboard",
    RESULT: "result",
} as const
export type GameState = (typeof GameStateEnum)[keyof typeof GameStateEnum]
