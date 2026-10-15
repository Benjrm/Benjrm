import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import useHostWebSocket from "@/features/session/websocket/hooks/useHostWebSocket.ts"
import useSocketEvent from "@/features/session/websocket/hooks/useSocketEvent.ts"
import useWebSocketContext from "@/features/session/websocket/hooks/useWebSocketContext.ts"
import useSessionQuiz from "@/features/session/hooks/useSessionQuiz"
import HostGameScreen from "@/features/session/views/HostGameScreen"
import HostLobby from "@/features/session/views/HostLobby"
import InvalidCode from "@/features/session/views/InvalidCode"
import useWebSocketConnectError from "@/features/session/websocket/hooks/useWebSocketConnectError.ts"
import useCodeWithDash from "@/features/session/utils/useCodeWithDash"
import { GameStateEnum } from "@/features/session/types/session.ts"
import type {
    GameQuestion,
    GameState,
    LeaderboardEntry,
    SessionPlayer,
} from "@/features/session/types/session.ts"
import type { QuestionStatistics } from "@/features/question/types/statistics.ts"
import parseDisplayQuestion from "@/features/question/utils/parseDisplayQuestion.ts"
import useAudio from "@/shared/hooks/useAudio.ts"
import type { ServerEvents } from "@/features/session/websocket/types/serverEvents"

interface HostDashboardComponentProps {
    code?: number
}

function HostDashboardComponent({ code }: Readonly<HostDashboardComponentProps>): JSX.Element {
    const { t } = useTranslation()
    const location = useLocation()
    useHostWebSocket(code)
    const ws = useWebSocketContext()

    const { data: quiz } = useSessionQuiz(code)
    const codeWithDash = useCodeWithDash(code)

    const [startPending, setStartPending] = useState(false)
    const [gameState, setGameState] = useState<GameState>(GameStateEnum.LOBBY)
    const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
    const [totalQuestions, setTotalQuestions] = useState(0)
    const [questionExpiresAt, setQuestionExpiresAt] = useState<number | null>(null)
    const [questionStartsAt, setQuestionStartsAt] = useState<number | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
    const [questionStatistics, setQuestionStatistics] = useState<QuestionStatistics | null>(null)
    const [isFinalLeaderboard, setIsFinalLeaderboard] = useState(false)
    const [hasPendingFinalPodium, setHasPendingFinalPodium] = useState(false)
    const [players, setPlayers] = useState<SessionPlayer[]>(
        (location.state as { players?: SessionPlayer[] } | null)?.players ?? []
    )

    const hasDisplayedQuestionRef = useRef(false)
    const gameEndedRef = useRef(false)

    const sendEndGame = useCallback(async (): Promise<void> => {
        const end = await ws.send({ command: "endGame" })
        const err = end.getError()
        if (err != null) {
            toast.error(err.message || t("lobby.errors.somethingWentWrong"))
            return
        }
        gameEndedRef.current = true
    }, [t, ws])

    const sendShowPodium = useCallback(async (): Promise<void> => {
        const res = await ws.send({ command: "showPodium" })
        const err = res.getError()
        if (err != null) {
            toast.error(t("lobby.errors.somethingWentWrong"))
        }
    }, [t, ws])

    const showPodium = useCallback((): void => {
        setIsFinalLeaderboard(true)
        setHasPendingFinalPodium(false)
        sendShowPodium()
    }, [sendShowPodium])

    useSocketEvent("displayPodium", () => {
        setIsFinalLeaderboard(true)
        setHasPendingFinalPodium(false)
    })

    useSocketEvent("displayLeaderboard", (payload) => {
        setLeaderboard(payload.leaderboard)
        setGameState(GameStateEnum.LEADERBOARD)
        if (payload.isFinal) {
            if (currentQuestion?.type === "SLIDE") {
                // Slide questions have no result screen — jump straight to podium
                showPodium()
            } else {
                setHasPendingFinalPodium(true)
            }
        } else {
            setIsFinalLeaderboard(false)
            setHasPendingFinalPodium(false)
        }
    })

    useSocketEvent("showStatistics", (payload) => {
        setQuestionStatistics(payload)
    })

    useSocketEvent("addPlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => [...prev, { id, name, emoji }])
    })
    useSocketEvent("renamePlayer", ({ id, name, emoji }) => {
        setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name, emoji } : p)))
    })
    useSocketEvent("removePlayer", ({ id }) => {
        const leaving = players.find((p) => p.id === id)
        if (leaving)
            toast(
                `${leaving.emoji ? `${leaving.emoji} ` : ""}${t("game.playerLeft", { name: leaving.name })}`
            )
        setPlayers((prev) => prev.filter((p) => p.id !== id))
    })
    useSocketEvent("setPlayers", ({ players: newPlayers }) => setPlayers(newPlayers))

    const onKickPlayer = useCallback(
        async (playerId: string): Promise<void> => {
            const res = await ws.send({ command: "kickPlayer", payload: { id: playerId } })
            const err = res.getError()
            if (err != null) {
                toast.error(t("lobby.errors.somethingWentWrong"))
            }
        },
        [t, ws]
    )

    const { isReconnecting, isInvalidCode, unableToConnect } = useWebSocketConnectError(ws, code)

    const displayQuestion = useCallback(
        (question: ServerEvents["displayQuestion"], timing?: string) => {
            hasDisplayedQuestionRef.current = true
            setGameState(GameStateEnum.QUESTION)
            setCurrentQuestion(parseDisplayQuestion(question))
            const startsAt = timing ? new Date(timing).getTime() : Date.now()
            setQuestionStartsAt(startsAt)
            setQuestionExpiresAt(question.seconds ? startsAt + question.seconds * 1000 : null)
            setTotalQuestions(question.totalQuestions)
            setCurrentQuestionIndex(question.index)
            if (question.index === question.totalQuestions - 1) {
                setHasPendingFinalPodium(true)
            }
        },
        []
    )

    useSocketEvent("displayQuestion", (payload, timing) => {
        displayQuestion(payload, timing)
    })

    const nextQuestion = useCallback(async () => {
        const next = await ws.send({ command: "nextQuestion" })
        const nextErr = next.getError()
        if (nextErr != null) {
            toast.error(nextErr.message || t("lobby.errors.failedToStart"))
        }
    }, [t, ws])

    const onStartGame = useCallback(async () => {
        if (players.length === 0) {
            toast.error(t("lobby.errors.waitingForPlayers"))
            return
        }

        const startErr = (await ws.send({ command: "start" })).getError()
        if (startErr != null) {
            toast.error(startErr.message || t("lobby.errors.failedToStart"))
        } else {
            setGameState(GameStateEnum.PLAYING)
            await nextQuestion()
        }
        setStartPending(false)
    }, [players.length, ws, t, nextQuestion])

    const sendNextQuestion = useCallback(async () => {
        await nextQuestion()
    }, [nextQuestion])

    const { setAudioElement, playAudio } = useAudio()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    useEffect(() => {
        if (isInvalidCode) return undefined
        if (audioRef.current === null) {
            audioRef.current = new Audio("/Clear_Path_Ahead.mp3")
            audioRef.current.loop = true
        }
        setAudioElement(audioRef.current)

        const handleInteraction = (): void => {
            playAudio()
            document.removeEventListener("click", handleInteraction)
            document.removeEventListener("keydown", handleInteraction)
        }
        document.addEventListener("click", handleInteraction)
        document.addEventListener("keydown", handleInteraction)

        return () => {
            document.removeEventListener("click", handleInteraction)
            document.removeEventListener("keydown", handleInteraction)
            setAudioElement(null)
            audioRef.current?.pause()
        }
    }, [setAudioElement, playAudio, isInvalidCode])

    if (isInvalidCode || unableToConnect) {
        return <InvalidCode codeWithDash={codeWithDash} unableToConnect={unableToConnect} />
    }

    return (
        <>
            {isReconnecting ? (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 text-center backdrop-blur-sm">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                    <p className="text-muted-foreground">{t("game.reconnecting")}</p>
                </div>
            ) : null}
            {gameState === GameStateEnum.LOBBY ? (
                <HostLobby
                    codeWithDash={codeWithDash}
                    onKickPlayer={onKickPlayer}
                    onStartGame={onStartGame}
                    players={players}
                    quiz={quiz}
                    startPending={startPending}
                />
            ) : (
                <HostGameScreen
                    codeWithDash={codeWithDash}
                    currentQuestion={currentQuestion}
                    currentQuestionIndex={currentQuestionIndex}
                    gameState={gameState}
                    isFinalLeaderboard={isFinalLeaderboard}
                    leaderboard={leaderboard}
                    onEndGame={sendEndGame}
                    onNextQuestion={sendNextQuestion}
                    onShowPodium={hasPendingFinalPodium ? showPodium : undefined}
                    players={players}
                    questionExpiresAt={questionExpiresAt}
                    questionStartsAt={questionStartsAt}
                    questionStatistics={questionStatistics}
                    quizTitle={quiz?.title}
                    totalQuestions={totalQuestions}
                />
            )}
        </>
    )
}

export default function HostDashboard(): JSX.Element {
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    return <HostDashboardComponent key={code} code={code} />
}
