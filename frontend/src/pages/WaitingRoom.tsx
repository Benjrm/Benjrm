// frontend/src/pages/WaitingRoom.tsx

import type { JSX } from "react"
import { useNavigate, useParams } from "react-router"
import GamePinForm from "@/components/GamePinForm"
import useSessionStatus from "@/api/session/hooks/useSessionStatus"
import useSessionQuiz from "@/api/session/hooks/useSessionQuiz"
import { useGameSession } from "@/hooks/useGameSession"
import Lobby from "@/components/Lobby"
import GameScreen from "@/components/GameScreen"
import HostGameScreen from "@/components/HostGameScreen"

export default function WaitingRoom(): JSX.Element {
    const navigate = useNavigate()
    const codeParam = useParams().code
    const code = codeParam !== null ? Number(codeParam) || undefined : undefined
    const codeWithDash =
        code !== undefined
            ? ((s) => {
                  const mid = Math.floor(s.length / 2)
                  return `${s.slice(0, mid)}-${s.slice(mid)}`
              })(String(code).padStart(8, "0"))
            : undefined

    const { isLoading: isLoadingSession, isHost, isPlayer, isInvalidCode } = useSessionStatus(code)
    const { data: quiz, isLoading: isLoadingQuiz } = useSessionQuiz(isHost ? code : undefined)

    const wsCode = isLoadingSession ? undefined : code

    const storageKey = code !== undefined ? `waitingRoom:${code}` : null
    const session = useGameSession({ code, wsCode, isHost, isPlayer, storageKey })

    if (isLoadingSession || isLoadingQuiz || (isPlayer && session.wsConnected === undefined)) {
        return (
            <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#00D4E8]" />
                <p className="text-muted-foreground text-sm">Loading the quiz lobby…</p>
            </section>
        )
    }

    if (isInvalidCode || !code || (isPlayer && session.wsConnected === false)) {
        return (
            <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6 py-24">
                <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-500">
                    <h1 className="text-base font-bold">Quiz lobby not found</h1>
                    <p className="mt-1 text-sm">
                        No lobby with the code{" "}
                        <span className="font-mono font-bold">{codeWithDash}</span> was found.
                        Please check the invitation code and try again.
                    </p>
                </div>
                <GamePinForm
                    onJoin={(digits) => {
                        navigate(`/play/${encodeURIComponent(digits)}`)
                    }}
                />
            </section>
        )
    }

    if (session.gameState === "lobby") {
        return (
            <Lobby
                codeWithDash={codeWithDash}
                emoji={session.emoji}
                isEmojiOpen={session.isEmojiOpen}
                isHost={isHost}
                name={session.name}
                nameError={session.nameError}
                nameSaved={session.nameSaved}
                onCloseEmoji={session.setIsEmojiOpen}
                onKickPlayer={session.onKickPlayer}
                onNameChange={session.setName}
                onOpenEmoji={() => session.setIsEmojiOpen(true)}
                onPickEmoji={session.onPickEmoji}
                onSaveName={session.onSaveName}
                onStartGame={session.onStartGame}
                pendingId={session.pendingId}
                pendingStartId={session.pendingStartId}
                players={session.players}
                quiz={quiz}
            />
        )
    }

    if (isHost) {
        return (
            <HostGameScreen
                codeWithDash={codeWithDash}
                currentQuestion={session.currentQuestion}
                currentQuestionIndex={session.currentQuestionIndex}
                gameState={session.gameState}
                isFinalLeaderboard={session.isFinalLeaderboard}
                leaderboard={session.leaderboard}
                onEndGame={session.sendEndGame}
                onNextQuestion={session.sendNextQuestion}
                players={session.players}
                questionExpiresAt={session.questionExpiresAt}
                quizTitle={quiz?.title}
                totalQuestions={session.totalQuestions}
            />
        )
    }

    return (
        <GameScreen
            currentQuestion={session.currentQuestion}
            currentQuestionIndex={session.currentQuestionIndex}
            gameState={session.gameState}
            isFinalLeaderboard={session.isFinalLeaderboard}
            leaderboard={session.leaderboard}
            onNextQuestion={session.sendNextQuestion}
            onSendAnswer={session.sendAnswer}
            playerName={session.name || undefined}
            questionExpiresAt={session.questionExpiresAt}
            questionResult={session.questionResult}
            totalQuestions={session.totalQuestions}
        />
    )
}
