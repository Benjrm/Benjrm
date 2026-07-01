export type QuestionStatistics = ChoiceQuestionStatistics | OrderQuestionStatistics

/**
 * Interface that represents the question statistics for a "ORDER" question.
 */
interface OrderQuestionStatistics {
    type: "ORDER"
    answers: number
    correct: string[]
    answerStatistic: number[]
}

/**
 * Interface that represents the question statistics for a "SINGLE_CHOICE" or "MULTIPLE_CHOICE" question.
 */
interface ChoiceQuestionStatistics {
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
    answers: number
    answerStatistic: ChoiceAnswerStatistic[]
}

/**
 * Interface that represents the statistic for one answer option of a "SINGLE_CHOICE" or "MULTIPLE_CHOICE" question.
 */
interface ChoiceAnswerStatistic {
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

export interface OptionStat {
    id: string
    text: string
    votes: number
    isCorrect: boolean
}
