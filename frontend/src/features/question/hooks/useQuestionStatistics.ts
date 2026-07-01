import { useMemo } from "react"
import type { QuestionStatistics, StatisticOption } from "@/features/question/types/statistics.ts"
import type { GameQuestion } from "@/features/session/types/session.ts"

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

        // Stats available
        // For Single/Multiple Choice: The backend sends the votes and correct flags for each option.
        // For ORDER questions: The backend deliberately sends the options in the original, correct sequence.
        if (questionStatistics && questionStatistics.answerStatistic.length > 0) {
            if (questionStatistics.type === "ORDER") {
                return questionStatistics.correct.map((optionId) => {
                    // The backend only sends the option ID, so we look up the actual text
                    // from the local currentQuestion state.
                    const currentOption = currentQuestion.options.find(
                        (option) => option.id === optionId
                    )
                    return {
                        id: optionId,
                        text: currentOption?.text ?? "",
                        votes: 0,
                        isCorrect: false,
                    }
                })
            }
            return questionStatistics.answerStatistic.map((stat) => {
                // The backend only sends the option ID, so we look up the actual text
                // from the local currentQuestion state.
                const currentOption = currentQuestion.options.find(
                    (option) => option.id === stat.option
                )
                return {
                    id: stat.option,
                    text: currentOption?.text ?? "",
                    votes: stat.votes,
                    isCorrect: stat.correct,
                }
            })
        }

        // Fallback (Loading / Initial State)
        // Before the websocket event with the actual statistics arrives, we render an empty initial state.
        // We just map the local options and default to 0 votes.
        return currentQuestion.options.map((option) => ({
            id: option.id,
            text: option.text,
            votes: 0,
            isCorrect: false,
        }))
    }, [currentQuestion, questionStatistics])

    const totalAnswers = questionStatistics?.answers ?? 0

    return { statisticOptions, totalAnswers }
}
