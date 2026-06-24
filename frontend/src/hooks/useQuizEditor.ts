import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useQuiz, useDeleteQuiz } from "@/api/quizzes/quizzes.queries.ts"
import { useQuestions } from "@/api/questions"
import questionKeys from "@/api/questions/utils/questionKeys"
import {
    createEmptyQuestion,
    applyQueueToQuestions,
} from "@/pages/quiz/quizUtils"
import tempId from "@/utils/tempId"
import useQuestionChangeQueue from "@/hooks/useQuestionChangeQueue"
import { ApiError } from "@/api/utils"
import { getQuiz } from "@/api/quizzes/quizzes.api.ts"
import type { Question, UpdateQuestionRequest } from "@/api/questions/questions.types.ts"
import {
    questionToQuestionRequest,
    questionToUpdateQuestionRequest,
} from "@/api/questions/question.mapper.ts"
import {
    addOptionToQuestion,
    removeOptionFromQuestion,
    updateOptionInQuestionAtIndex,
} from "@/api/questions/utils/questionUtils.ts"
import QuestionQueueError from "@/queue/queue.error.ts"

export interface QuestionError {
    missingQuestion: boolean
    missingAnswers: number[]
    missingCorrectAnswer: boolean
}

export interface UseQuizEditorResult {
    quiz: unknown
    quizTitle: string
    quizDescription: string
    isLoading: boolean
    error: unknown
    questionError: QuestionError
    bigQuestionError: string | null
    isLoadingQuestions: boolean
    questionLoadError: unknown
    isQuizPlayable: boolean
    questions: Question[]
    currentQuestionIndex: number
    handleSelectQuestion: (n: number) => void
    currentQuestion: Question
    questionIds: string[]
    activeQuestionId: string | null
    setActiveQuestionId: (id: string | null) => void
    handleDragStart: (e: DragStartEvent) => void
    handleDragEnd: (e: DragEndEvent) => void
    handleDragCancel: () => void
    reorderQuestions: (a: string, b: string) => void
    updateQuestion: (data: Question) => void
    updateOption: (index: number, value: string) => void
    toggleOptionCorrect: (index: number) => void
    reorderOptions: (activeId: string, overId: string) => void
    deleteQuestion: (index: number) => void
    handleAddQuestion: () => void
    handleAddOption: () => void
    handleDeleteOption: (index: number) => void
    handleSaveQuestions: () => Promise<{ ok: boolean; error?: string }>
    isSavingQuestions: boolean
    hasUnsavedChanges: boolean
    setHasUnsavedChanges: (b: boolean) => void
    discardChanges: () => void
    flush: () => Promise<{ items: unknown[]; idMap: Record<string, string> } | null>
    upsertReorder: (order: string[]) => void
    upsertUpdate: (id: string, payload: UpdateQuestionRequest) => void
    deleteQuizMutation: ReturnType<typeof useDeleteQuiz>
    hasInitializedQuestions: boolean
}

export default function useQuizEditor(quizId?: string): UseQuizEditorResult {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { data: quiz, isLoading, error } = useQuiz(quizId)
    const deleteQuizMutation = useDeleteQuiz()
    const {
        data: savedQuestions,
        isLoading: isLoadingQuestions,
        error: questionLoadError,
    } = useQuestions(quizId)

    const quizTitle = quiz?.title ?? t("quizEditor.editor.untitledQuiz")
    const quizDescription = quiz?.description ?? ""

    const [questionError, setQuestionError] = useState<QuestionError>({
        missingQuestion: false,
        missingAnswers: [],
        missingCorrectAnswer: false,
    })
    const [bigQuestionError, setBigQuestionError] = useState<string | null>(null)

    const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion()])
    // eslint-disable-next-line react/hook-use-state
    const [currentQuestionIndex, setCurrentQuestionIndexInternal] = useState<number>(0)
    const [hasInitializedQuestions, setHasInitializedQuestions] = useState(false)
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(!quizId)
    const [isSavingQuestions, setIsSavingQuestions] = useState(false)

    const currentQuestion = questions[currentQuestionIndex] ?? questions[0] ?? createEmptyQuestion()
    const questionIds = useMemo(() => questions.map((q) => q.id), [questions])

    const saveTimeoutRef = useRef<number | null>(null)
    const reorderTimeoutRef = useRef<number | null>(null)

    const {
        clear,
        cleanup,
        flush,
        queue,
        upsertDelete,
        upsertCreate,
        upsertReorder,
        upsertUpdate,
    } = useQuestionChangeQueue(quizId)

    useEffect(() => {
        cleanup(async (id: string) => {
            try {
                await getQuiz(id)
            } catch (err) {
                if (err instanceof ApiError) {
                    if (err.error === "not_found") {
                        return false
                    }
                }
            }
            return true
        })
    }, [cleanup])

    /**
     * @returns [isQuestionAffected, affectedAnswer | null, errorMessage, quizErrorMessage] | null
     */
    const validateQuestion = (question: Question): QuestionError | null => {
        const validationError: QuestionError = {
            missingQuestion: false,
            missingAnswers: [],
            missingCorrectAnswer: false,
        }
        if (!question.question.trim()) {
            validationError.missingQuestion = true
        }

        if (question.type !== "SLIDE") {
            for (let oi = 0; oi < question.options.length; oi += 1) {
                if (!question.options[oi].answer.trim()) {
                    validationError.missingAnswers.push(oi)
                }
            }
            if (
                question.type !== "ORDER" &&
                !question.options.some((o) => (o as { correct?: boolean }).correct)
            ) {
                validationError.missingCorrectAnswer = true
            }
        }
        if (
            validationError.missingQuestion ||
            validationError.missingAnswers.length !== 0 ||
            validationError.missingCorrectAnswer
        ) {
            return validationError
        }
        return null
    }

    const validateQuestions = (): string | null => {
        if (!quizId) return t("quizEditor.validation.createQuizFirst")
        if (!questions.length) return t("quizEditor.validation.addAtLeastOne")

        for (let qi = 0; qi < questions.length; qi += 1) {
            const validationRes = validateQuestion(questions[qi])
            if (validationRes) {
                if (validationRes.missingQuestion) {
                    if (questions[qi].type === "SLIDE") {
                        return t("quizEditor.validation.slideMissingText", { index: qi + 1 })
                    }
                    return t("quizEditor.validation.questionMissingText", { index: qi + 1 })
                }
                if (validationRes.missingAnswers.length !== 0) {
                    const answer = validationRes.missingAnswers[0]
                    return t("quizEditor.validation.optionEmpty", {
                        questionIndex: qi + 1,
                        optionIndex: answer + 1,
                    })
                }
                if (validationRes.missingCorrectAnswer) {
                    return t("quizEditor.validation.needsCorrectAnswer", { index: qi + 1 })
                }
                return t("quizEditor.validation.unknownError", { index: qi + 1 })
            }
        }

        return null
    }

    const showBigQuestionError = useCallback(
        (showError: QuestionError) => {
            let errorMessage = null
            if (showError.missingQuestion) {
                errorMessage = t("quizEditor.validation.missingQuestionText")
            } else if (showError.missingAnswers.length !== 0) {
                const option = showError.missingAnswers[0]
                errorMessage = t("quizEditor.validation.optionIsEmpty", { index: option + 1 })
            } else if (showError.missingCorrectAnswer) {
                errorMessage = t("quizEditor.validation.oneCorrectRequired")
            }
            setQuestionError(showError)
            setBigQuestionError(errorMessage)
        },
        [t]
    )

    const setCurrentQuestionIndex = useCallback(
        (value: number | ((number: number) => number)) => {
            if (hasInitializedQuestions) {
                const validationRes = validateQuestion(currentQuestion)
                if (validationRes) {
                    showBigQuestionError(validationRes)
                } else {
                    setCurrentQuestionIndexInternal(value)
                }
            }
        },
        [hasInitializedQuestions, currentQuestion, showBigQuestionError]
    )

    const handleSelectQuestion = (index: number) => {
        const validationResCurrentQuestion = validateQuestion(currentQuestion)
        if (validationResCurrentQuestion) {
            showBigQuestionError(validationResCurrentQuestion)
        } else {
            setCurrentQuestionIndexInternal(index)
            const validationRes = validateQuestion(questions[index])
            if (validationRes) {
                setQuestionError(validationRes)
                showBigQuestionError(validationRes)
            } else {
                setQuestionError({
                    missingQuestion: false,
                    missingAnswers: [],
                    missingCorrectAnswer: false,
                })
                setBigQuestionError(null)
            }
        }
    }

    useEffect(() => {
        if (!quizId || hasInitializedQuestions || !savedQuestions) return undefined

        const base = savedQuestions.length > 0 ? savedQuestions : []

        const applied = applyQueueToQuestions(base, queue)
        const final = applied.length > 0 ? applied : [createEmptyQuestion()]

        const initTimeoutId = setTimeout(() => {
            setQuestions(final)
            setCurrentQuestionIndex((prev) => Math.min(prev, Math.max(final.length - 1, 0)))
            setHasUnsavedChanges(queue.length > 0)
            setHasInitializedQuestions(true)
        })

        return () => clearTimeout(initTimeoutId)
    }, [hasInitializedQuestions, queue, quizId, savedQuestions, setCurrentQuestionIndex])

    useEffect(
        () => () => {
            if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
            if (reorderTimeoutRef.current) window.clearTimeout(reorderTimeoutRef.current)
        },
        []
    )

    const markUnsavedChanges = () => {
        setHasUnsavedChanges(true)
    }

    const discardChanges = () => {
        if (reorderTimeoutRef.current) {
            window.clearTimeout(reorderTimeoutRef.current)
            reorderTimeoutRef.current = null
        }

        clear()

        const baseQs =
            savedQuestions && savedQuestions.length > 0 ? savedQuestions : [createEmptyQuestion()]

        setQuestions(baseQs)
        setCurrentQuestionIndex((prev) => Math.min(prev, Math.max(baseQs.length - 1, 0)))
        setHasUnsavedChanges(false)
        setQuestionError({
            missingQuestion: false,
            missingAnswers: [],
            missingCorrectAnswer: false,
        })
        setBigQuestionError(null)
    }

    const reorderQuestions = (activeId: string, overId: string) => {
        markUnsavedChanges()

        const selectedQuestionId = questions[currentQuestionIndex]?.id ?? null

        const oldIndex = questions.findIndex((question) => question.id === activeId)
        const newIndex = questions.findIndex((question) => question.id === overId)

        if (!(oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)) {
            const nextQuestions = arrayMove(questions, oldIndex, newIndex)

            const newOrder = nextQuestions.map((q) => q.id)
            if (reorderTimeoutRef.current) window.clearTimeout(reorderTimeoutRef.current)
            reorderTimeoutRef.current = window.setTimeout(() => {
                upsertReorder(newOrder)
                reorderTimeoutRef.current = null
            }, 300)

            setQuestions(nextQuestions)

            if (selectedQuestionId) {
                const selectedIndex = nextQuestions.findIndex((q) => q.id === selectedQuestionId)
                setCurrentQuestionIndexInternal(selectedIndex >= 0 ? selectedIndex : 0)
            }
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveQuestionId(null)
        if (!over || active.id === over.id) return
        reorderQuestions(String(active.id), String(over.id))
    }

    const handleDragStart = (event: DragStartEvent) => setActiveQuestionId(String(event.active.id))
    const handleDragCancel = () => setActiveQuestionId(null)

    const toFriendlySaveError = (err: unknown): string => {
        const message = err instanceof Error ? err.message : String(err)

        if (message.includes("backend is currently unavailable")) {
            return "The changes could not be saved please try again later."
        }

        return "The changes could not be saved. Please try again."
    }

    const handleSaveQuestions = async () => {
        const validationError = validateQuestions()
        if (validationError) {
            return { ok: false, error: validationError }
        }
        if (!quizId) {
            const err = "Save the quiz first before persisting questions to the adapter."
            toast.error(err)
            return { ok: false, error: err }
        }

        if (reorderTimeoutRef.current) {
            window.clearTimeout(reorderTimeoutRef.current)
            reorderTimeoutRef.current = null
            upsertReorder(questions.map((q) => q.id))
        }

        setIsSavingQuestions(true)

        try {
            const flushResult = await flush()

            if (
                Object.keys(flushResult.idMap).length > 0 ||
                Object.keys(flushResult.optionIdsByQuestion).length > 0
            ) {
                const { idMap, optionIdsByQuestion } = flushResult
                setQuestions((prev) =>
                    prev.map((q) => {
                        if (q.type !== "SLIDE" && optionIdsByQuestion[q.id]) {
                            q.options.forEach(
                                // eslint-disable-next-line no-return-assign
                                (option, optionIndex) =>
                                    // eslint-disable-next-line no-param-reassign
                                    (option.id = optionIdsByQuestion[q.id][optionIndex])
                            )
                        }
                        return { ...q, id: idMap[q.id] ?? q.id }
                    })
                )
            }

            await queryClient.invalidateQueries({ queryKey: questionKeys.all(quizId) })
            if (flushResult.failed.length > 0) {
                const question = queue.find((item) => item.id === flushResult.failed[0].itemId)
                const questionId =
                    question && question.op !== "reorder" ? question.questionId : undefined
                throw new QuestionQueueError(questionId, new Error(flushResult.failed[0].error))
            }
            setHasUnsavedChanges(false)
            toast.success("Quiz changes saved.")

            if (typeof window !== "undefined") {
                if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
                saveTimeoutRef.current = null
            }

            return { ok: true }
        } catch (err) {
            let msg = ""
            if (err instanceof QuestionQueueError) {
                const question = questions.findIndex((q) => q.id === err.question)
                if (question !== -1) {
                    msg += `Question ${question + 1}: `
                }
                msg += err.error.message
            } else {
                msg = toFriendlySaveError(err)
            }
            return { ok: false, error: msg }
        } finally {
            setIsSavingQuestions(false)
        }
    }

    const updateQuestion = (question: Question) => {
        markUnsavedChanges()
        if (question.id.startsWith("temp-")) {
            upsertCreate(question.id, questionToQuestionRequest(question))
        } else {
            upsertUpdate(question.id, questionToUpdateQuestionRequest(question))
        }
        setQuestions((prevQuestions) => {
            const updated = [...prevQuestions]
            updated[currentQuestionIndex] = question
            return updated
        })
        const validationRes = validateQuestion(question)
        if (validationRes && bigQuestionError) {
            setQuestionError(validationRes)
            showBigQuestionError(validationRes)
        } else {
            setQuestionError({
                missingQuestion: false,
                missingAnswers: [],
                missingCorrectAnswer: false,
            })
            setBigQuestionError(null)
        }
    }

    /**
     * Updates the 'answer' field of the option at the given index for the current question.
     * @param index The index of the option in the options array to update.
     * @param value The 'answer' field of the option to update with the new value.
     */
    const updateOption = (index: number, value: string) => {
        if (currentQuestion.type === "SLIDE") return
        markUnsavedChanges()
        updateQuestion(
            updateOptionInQuestionAtIndex(currentQuestion, index, (opt) => ({
                ...opt,
                answer: value,
            }))
        )
    }

    /**
     * Toggles the correct field of an option for questions of type "SINGLE_CHOICE" and "MULTIPLE_CHOICE".
     * Does nothing for "ORDER" and "SLIDE" type questions.
     * @param index The index of the option in the options array to toggle the correct field.
     */
    const toggleOptionCorrect = (index: number) => {
        if (currentQuestion.type === "ORDER" || currentQuestion.type === "SLIDE") return
        markUnsavedChanges()
        updateQuestion(
            updateOptionInQuestionAtIndex(currentQuestion, index, (opt) => ({
                ...opt,
                correct: !opt.correct,
            }))
        )
    }

    /**
     * Swaps the position of two options in a question of type "ORDER".
     * @param activeId The option's id that is being dragged.
     * @param overId The option's id that is being dragged over.
     */
    const reorderOptions = (activeId: string, overId: string) => {
        if (currentQuestion.type !== "ORDER") return
        const oldIndex = currentQuestion.options.findIndex((option) => option.id === activeId)
        const newIndex = currentQuestion.options.findIndex((option) => option.id === overId)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
        markUnsavedChanges()
        const newOptions = arrayMove(currentQuestion.options, oldIndex, newIndex)
        updateQuestion({ ...currentQuestion, options: newOptions })
    }

    const deleteQuestion = (indexToDelete: number) => {
        markUnsavedChanges()
        if (reorderTimeoutRef.current) {
            window.clearTimeout(reorderTimeoutRef.current)
            reorderTimeoutRef.current = null
        }
        const deletingQuestion = questions[indexToDelete]
        const deletingId = deletingQuestion?.id
        if (questions.length === 1) {
            setQuestions([createEmptyQuestion()])
            setCurrentQuestionIndex(0)
        } else {
            const nextQuestions = questions.filter((_, index) => index !== indexToDelete)
            setQuestions(nextQuestions)

            if (quizId && nextQuestions.length > 0) {
                upsertReorder(nextQuestions.map((question) => question.id))
            }

            let questionIndex = currentQuestionIndex
            if (questionIndex >= nextQuestions.length && questionIndex > 0) {
                questionIndex -= 1
                setCurrentQuestionIndexInternal(questionIndex)
            }

            const validationRes = validateQuestion(nextQuestions[questionIndex])
            if (validationRes) {
                setQuestionError(validationRes)
                showBigQuestionError(validationRes)
            } else {
                setQuestionError({
                    missingQuestion: false,
                    missingAnswers: [],
                    missingCorrectAnswer: false,
                })
                setBigQuestionError(null)
            }
        }

        upsertDelete(deletingId)
    }

    const handleAddQuestion = () => {
        const validationRes = validateQuestion(currentQuestion)
        if (validationRes) {
            showBigQuestionError(validationRes)
            return
        }
        markUnsavedChanges()
        const newQ = createEmptyQuestion()
        setQuestions((prev) => {
            const next = [...prev, newQ]
            setCurrentQuestionIndex(next.length - 1)
            return next
        })

        upsertCreate(newQ.id, questionToQuestionRequest(newQ))
    }

    /**
     * Adds a new option to the current question if the question type is not "SLIDE".
     */
    const handleAddOption = () => {
        if (currentQuestion.type === "SLIDE") return

        markUnsavedChanges()
        const newOption =
            currentQuestion.type === "ORDER"
                ? { id: tempId(), answer: "" }
                : { id: tempId(), answer: "", correct: false }

        updateQuestion(addOptionToQuestion(currentQuestion, newOption))
    }

    /**
     * Deletes the option at the given index from the current question's options array.
     * Does nothing if the question type is "SLIDE" or if there are only 2 options left (to ensure at least 2 options remain).
     * @param indexToDelete The index of the option to delete from the current question's options array.
     */
    const handleDeleteOption = (indexToDelete: number) => {
        if (currentQuestion.type === "SLIDE") return
        if (currentQuestion.options.length <= 2) return
        markUnsavedChanges()
        updateQuestion(removeOptionFromQuestion(currentQuestion, indexToDelete))
    }

    const isQuizPlayable =
        hasInitializedQuestions &&
        questions.length > 0 &&
        questions.every((q) => validateQuestion(q) === null)

    return {
        quiz,
        quizTitle,
        quizDescription,
        isLoading,
        error,
        questionError,
        bigQuestionError,
        isLoadingQuestions,
        questionLoadError,
        isQuizPlayable,
        questions,
        currentQuestionIndex,
        handleSelectQuestion,
        currentQuestion,
        questionIds,
        activeQuestionId,
        setActiveQuestionId,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
        reorderQuestions,
        updateQuestion,
        updateOption,
        toggleOptionCorrect,
        reorderOptions,
        deleteQuestion,
        handleAddQuestion,
        handleAddOption,
        handleDeleteOption,
        handleSaveQuestions,
        isSavingQuestions,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        discardChanges,
        flush,
        upsertReorder,
        upsertUpdate,
        deleteQuizMutation,
        hasInitializedQuestions,
    }
}
