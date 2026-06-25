import { useMemo } from "react"
import type { GameQuestion } from "@/hooks/useGameSession"

/**
 * Interface that represents the question statistics from the websocket.
 */
export interface QuestionStatistics {
    answers: number
    answerStatistic: AnswerStatistic[]
}

/**
 * Interface that represents the statistic for one answer option.
 */
export interface AnswerStatistic {
    option: string
    votes: number
    correct: boolean
}

/**
 * Interface that represents the statistic options for the current question with added fields for the UI.
 */
export interface StatisticOption {
    id: string
    text: string
    votes: number
    isCorrect: boolean
}

/**
 * useQuestionStatistics maps the websocket question statistics to the current question
 * @param currentQuestion the current question from the game session
 * @param questionStatistics websocket question statistics for the current question
 * @returns The mapped statistic options for the current question and the total number of answers.
 */
export default function useQuestionStatistics(
    currentQuestion: GameQuestion | null,
    questionStatistics: QuestionStatistics | null
): { statisticOptions: StatisticOption[]; totalAnswers: number } {
    const statisticOptions = useMemo(() => {
        if (!currentQuestion) return []
        return currentQuestion.options.map((option) => {
            const statisticsForOption = questionStatistics?.answerStatistic.find(
                (stat) => stat.option === option.id
            )
            return {
                id: option.id,
                text: option.text,
                votes: statisticsForOption ? statisticsForOption.votes : 0,
                isCorrect: statisticsForOption ? statisticsForOption.correct : false,
            }
        })
    }, [currentQuestion, questionStatistics])

    const totalAnswers = questionStatistics?.answers ?? 0

    return { statisticOptions, totalAnswers }
}
