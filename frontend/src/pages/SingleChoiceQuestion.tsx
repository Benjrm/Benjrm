import type { JSX } from "react"
import { useParams } from "react-router"

import QuestionHeader from "../components/QuestionHeader"
import QuestionContainer from "../components/QuestionContainer"
import AnswerOption from "@/components/AnswerOption"

import GameSessionProvider from "@/context/GameSessionProvider"
import useGameSession from "@/hooks/useGameSession"

const ICONS = ["▲", "◆", "●", "■", "◯", "◆"]
const COLORS = ["#2d4cc9", "#ffa602", "#11c8d4", "#ff4949", "#28c28b", "#8b5cf6"]

function SingleChoiceQuestionContent(): JSX.Element {
    const { question, remainingTime, selectedAnswer, sendAnswer } = useGameSession()

    return (
        <div className="bg-background text-foreground min-h-screen px-4 py-8">
            <div className="mx-auto flex max-w-md flex-col gap-6">
                <QuestionHeader
                    currentQuestion={1}
                    playerName="Funny Crocodile"
                    remainingTime={remainingTime}
                    totalQuestions={10}
                />

                <QuestionContainer question={question?.question} />

                <div className="grid grid-cols-2 gap-4">
                    {question?.options?.map((option, i) => (
                        <AnswerOption
                            key={option.id}
                            color={COLORS[i % COLORS.length]}
                            icon={ICONS[i % ICONS.length]}
                            index={i}
                            isSelected={selectedAnswer === option.id}
                            onSelect={() => sendAnswer(option.id)}
                            text={option.text}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function SingleChoiceQuestion(): JSX.Element {
    const { code } = useParams()

    return (
        <GameSessionProvider code={code}>
            <SingleChoiceQuestionContent />
        </GameSessionProvider>
    )
}
