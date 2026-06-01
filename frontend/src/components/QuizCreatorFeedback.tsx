import type { FC } from "react"

interface Props {
    hasUnsavedChanges: boolean
    quizLoadError?: string | null
    questionLoadError?: string | null
    isLoading: boolean
    quizId?: string | undefined
    isLoadingQuestions: boolean
    hasInitializedQuestions: boolean
    deleteError?: string | null
    saveSuccess?: string | null
    saveError?: string | null
    isSaveSuccessVisible?: boolean
}

const QuizCreatorFeedback: FC<Props> = ({
    hasUnsavedChanges,
    quizLoadError,
    questionLoadError,
    isLoading,
    quizId,
    isLoadingQuestions,
    hasInitializedQuestions,
    deleteError,
    saveSuccess,
    saveError,
    isSaveSuccessVisible,
}) => (
    <>
        {hasUnsavedChanges ? (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                There are still unsaved changes. Click{" "}
                <span className="font-semibold">Save Quiz</span> to save them.
            </div>
        ) : null}

        {quizLoadError && quizId ? (
            <p className="mb-6 text-sm text-red-500">{quizLoadError}</p>
        ) : null}

        {questionLoadError ? (
            <p className="mb-6 text-sm text-red-500">Failed to load questions.</p>
        ) : null}

        {isLoading && quizId ? (
            <p className="text-muted-foreground mb-6 text-sm">Loading quiz...</p>
        ) : null}

        {isLoadingQuestions && quizId && !hasInitializedQuestions ? (
            <p className="text-muted-foreground mb-6 text-sm">Loading questions...</p>
        ) : null}

        {deleteError ? <p className="mb-6 text-sm text-red-500">{deleteError}</p> : null}

        {saveSuccess ? (
            <p
                className={`mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm transition-all duration-700 dark:text-emerald-200 ${
                    isSaveSuccessVisible
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                }`}
            >
                {saveSuccess}
            </p>
        ) : null}

        {saveError ? <p className="mb-6 text-sm text-red-500">{saveError}</p> : null}
    </>
)

export default QuizCreatorFeedback
