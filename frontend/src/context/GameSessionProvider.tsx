import type { ReactNode, JSX } from "react"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { GameSessionContext } from "./GameSessionContext"
import type { Question, DisplayQuestionMessage } from "./GameSessionContext"

export default function GameSessionProvider({
    code,
    children,
}: {
    code: string | undefined
    children: ReactNode
}): JSX.Element {
    const [question, setQuestion] = useState<Question | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [remainingTime, setRemainingTime] = useState<number | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const socketRef = useRef<WebSocket | null>(null)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        if (!code) return undefined

        const socket = new WebSocket(`ws://localhost:8080/api/v1/sessions/${code}/ws`)
        socketRef.current = socket

        socket.onopen = () => {
            setIsConnected(true)
            socket.send(
                JSON.stringify({
                    command: "join",
                    payload: { name: "Funny Crocodile" },
                })
            )
        }

        socket.onmessage = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data)

                if (message.id !== undefined) {
                    socket.send(JSON.stringify({ id: message.id, timestamp: Date.now() }))
                    if (!message.command) return
                }

                switch (message.command) {
                    case "displayQuestion": {
                        const data = message as DisplayQuestionMessage
                        setQuestion(data.payload)
                        setSelectedAnswer(null)

                        if (timerRef.current) window.clearInterval(timerRef.current)

                        if (data.timing) {
                            const end = new Date(data.timing).getTime()
                            const updateTimer = () => {
                                const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
                                setRemainingTime(left)
                                if (left === 0 && timerRef.current) {
                                    window.clearInterval(timerRef.current)
                                }
                            }
                            updateTimer()
                            timerRef.current = window.setInterval(updateTimer, 1000)
                        } else {
                            setRemainingTime(null)
                        }
                        break
                    }

                    case "questionResult":
                        toast.success(`+${message.payload.points} points`)
                        break

                    default:
                        break
                }
            } catch {
                toast.error("Error processing server message")
            }
        }

        socket.onerror = () => toast.error("WebSocket connection failed")
        socket.onclose = () => setIsConnected(false)

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current)
            if (
                socket.readyState === WebSocket.OPEN ||
                socket.readyState === WebSocket.CONNECTING
            ) {
                socket.close()
            }
        }
    }, [code])

    const sendAnswer = useCallback(
        (answerId: string) => {
            if (!question || !socketRef.current) return
            setSelectedAnswer(answerId)
            socketRef.current.send(
                JSON.stringify({
                    command: "answerQuestion",
                    payload: { answers: [answerId] },
                })
            )
        },
        [question]
    )

    const contextValue = useMemo(
        () => ({
            question,
            remainingTime,
            selectedAnswer,
            sendAnswer,
            isConnected,
        }),
        [question, remainingTime, selectedAnswer, sendAnswer, isConnected]
    )

    return (
        <GameSessionContext.Provider value={contextValue}>{children}</GameSessionContext.Provider>
    )
}
