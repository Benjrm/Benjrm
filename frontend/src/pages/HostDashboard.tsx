import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useHostWebSocket, useSocketEvent, useWebSocketContext } from "@/api/websocket"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import HostGameScreen from "@/components/HostGameScreen"
import { GameStateEnum, parseDisplayQuestion } from "@/hooks/useGameSession"
import type { GameState, GameQuestion, LeaderboardEntry } from "@/hooks/useGameSession"
import { getSessionPlayers } from "@/api/session"
import type { SessionPlayer } from "@/api/session"
import type { QuestionStatistics } from "@/hooks/useQuestionStatistics"
import HostLobby from "@/components/HostLobby"
import InvalidCode from "@/components/InvalidCode"
import { useAudio } from "@/context/AudioContext"
import useWebSocketConnectError from "@/api/websocket/hooks/useWebSocketConnectError"
import useCodeWithDash from "@/hooks/useCodeWithDash"

function HostDashboardComponent({ code }: { code?: number }): JSX.Element {
    const { t } = useTranslation()
    const location = useLocation()
    useHostWebSocket(code)
    const ws = useWebSocketContext()

    const { data: quiz } = useSessionQuiz(code)
    const codeWithDash = useCodeWithDash(code)

    const [pendingStartId, setPendingStartId] = useState<number | null>(null)
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

    const sendEndGame = useCallback((): void => {
        gameEndedRef.current = true
        ws.send({ command: "endGame" })
    }, [ws])

    const sendShowPodium = useCallback((): void => {
        ws.send({ command: "showPodium" })
    }, [ws])

    const showPodium = useCallback((): void => {
        setIsFinalLeaderboard(true)
        setHasPendingFinalPodium(false)
        sendShowPodium()
    }, [sendShowPodium])

    useSocketEvent("displayPodium", () => {
        setIsFinalLeaderboard(true)
        setHasPendingFinalPodium(false)
    })

    useSocketEvent("displayQuestion", (payload, timing) => {
        hasDisplayedQuestionRef.current = true
        setGameState(GameStateEnum.QUESTION)
        setCurrentQuestion(parseDisplayQuestion(payload))
        const startsAt = timing ? new Date(timing).getTime() : Date.now()
        setQuestionStartsAt(startsAt)
        setQuestionExpiresAt(payload.seconds ? startsAt + payload.seconds * 1000 : null)
        setTotalQuestions(payload.totalQuestions)
        setCurrentQuestionIndex(payload.index)
    })

    useSocketEvent("displayLeaderboard", (payload) => {
        const isFinal =
            payload.isFinal || (totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1)
        setLeaderboard(payload.leaderboard)
        setGameState(GameStateEnum.LEADERBOARD)
        if (isFinal) {
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

    const onKickPlayer = useCallback(
        (playerId: string): void => {
            ws.send({ command: "kickPlayer", payload: { id: playerId } })
        },
        [ws]
    )

    useSocketEvent("ok", (_payload, _timing, id) => {
        if (id === pendingStartId) {
            setPendingStartId(null)
            setGameState(GameStateEnum.PLAYING)
        }
    })

    useSocketEvent("error", (payload, _timing, id) => {
        if (id === pendingStartId) {
            setPendingStartId(null)
            toast.error(payload.message || t("lobby.errors.failedToStart"))
        } else {
            toast.error(payload.message || t("game.anErrorOccurred"))
        }
    })

    const { isReconnecting, isInvalidCode, unableToConnect } = useWebSocketConnectError(ws, code)

    useEffect(
        () =>
            ws.onEveryConnect(async () => {
                if (code) setPlayers(await getSessionPlayers(code))
            }),
        [ws, code]
    )

    const onStartGame = useCallback((): void => {
        if (players.length === 0) {
            toast.error(t("lobby.errors.waitingForPlayers"))
            return
        }
        const id = Math.floor(Math.random() * 2 ** 31)
        setPendingStartId(id)
        ws.send({ id, command: "start" })
        ws.send({ command: "nextQuestion" })
    }, [players.length, ws, t])

    // Send endGame on unmount only after the first question was received from the server.
    // Guards against React StrictMode's double-mount: the cleanup fires before the server
    // ever sends displayQuestion, so hasDisplayedQuestionRef is still false then.
    useEffect(
        () => () => {
            if (!gameEndedRef.current && hasDisplayedQuestionRef.current) {
                ws.send({ command: "endGame" })
            }
        },
        [ws]
    )

    const sendNextQuestion = useCallback((): void => {
        ws.send({ command: "nextQuestion" })
    }, [ws])

    const { setAudioElement, playAudio } = useAudio()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    useEffect(() => {
        if (isInvalidCode) return undefined
        if (audioRef.current === null) {
            audioRef.current = new Audio("/Clear_Path_Ahead.mp3")
            audioRef.current.loop = true
        }
        setAudioElement(audioRef.current)
        playAudio()

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
                    startPending={pendingStartId !== null}
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
