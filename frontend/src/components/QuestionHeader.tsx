import type { JSX } from "react"

interface QuestionHeaderProps {
    playerName: string
    currentQuestion: number
    totalQuestions: number
    remainingTime: number | null
}

export default function QuestionHeader({
    playerName,
    currentQuestion,
    totalQuestions,
    remainingTime,
}: QuestionHeaderProps): JSX.Element {
    const formattedTime =
        remainingTime !== null
            ? `${Math.floor(remainingTime / 60)
                  .toString()
                  .padStart(2, "0")}:${(remainingTime % 60).toString().padStart(2, "0")}`
            : null

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className="bg-muted/40 rounded-full px-4 py-2 text-sm font-bold">{playerName}</div>

            <div className="text-muted-foreground flex w-full items-center justify-between px-2 text-sm font-bold">
                <div>
                    {formattedTime !== null ? `Time: ${formattedTime}` : "Waiting for timer..."}
                </div>

                <div>
                    {currentQuestion} / {totalQuestions}
                </div>
            </div>
        </div>
    )
}
