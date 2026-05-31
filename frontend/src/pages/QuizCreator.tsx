// frontend/src/pages/QuizCreator.tsx

import type { JSX } from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Edit2, Settings, Trash2 } from "lucide-react"
import { useParams, useNavigate } from "react-router"
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

import CreateQuizModal from "../components/CreateQuizModal"
import QuestionEditor from "../components/QuestionEditor"
import QuestionSidebar from "../components/QuestionSidebar"
import SettingsPanel from "../components/SettingsPanel"
import { useQuiz, useDeleteQuiz } from "@/api/queries"
import { useCreateQuestion, useDeleteQuestion, useQuestions } from "@/api/questions"
import type { Question } from "@/types/quiz"
import { createEmptyQuestion, questionToRequest, responseToQuestion, restrictToVerticalAxis } from "./quiz/quizUtils"
import useQuestionChangeQueue from "@/hooks/useQuestionChangeQueue"

import { Button } from "@/shadcn/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/shadcn/components/ui/dialog"

function getReadableQuizErrorMessage(error: Error | null | undefined): string | null {
    if (!error) return null

    return "Quiz data could not be loaded right now."
}


// draft storage removed; change-queue hook persists changes instead

// `restrictToVerticalAxis` imported from `quizUtils`

// --- Main Page ---

export default function QuizCreator(): JSX.Element {
    const { quizId } = useParams()
    const navigate = useNavigate()
    const modalMode = quizId ? "edit" : "create"

    // Query for loading quiz data
    const { data: quiz, isLoading, error } = useQuiz(quizId)
    const deleteQuizMutation = useDeleteQuiz()
    const {
        data: savedQuestions,
        isLoading: isLoadingQuestions,
        error: questionLoadError,
    } = useQuestions(quizId)
    const createQuestionMutation = useCreateQuestion(quizId)
    const deleteQuestionMutation = useDeleteQuestion(quizId)

    // Derived values
    const quizTitle = quiz?.title ?? "Untitled"
    const quizDescription = quiz?.description ?? ""
    const quizLoadError = getReadableQuizErrorMessage(error)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
    const [isSaveSuccessVisible, setIsSaveSuccessVisible] = useState(false)
    const [isSavingQuestions, setIsSavingQuestions] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(!quizId)
    const [isQuestionsReady, setIsQuestionsReady] = useState(false)

    const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion()])

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
    const [hasInitializedQuestions, setHasInitializedQuestions] = useState(false)
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

    const saveTimeoutRef = useRef<number | null>(null)
    const saveSuccessHideTimeoutRef = useRef<number | null>(null)
    const saveSuccessCleanupTimeoutRef = useRef<number | null>(null)
    const reorderTimeoutRef = useRef<number | null>(null)

    const { enqueue, flush, upsertReorder, upsertUpdate } = useQuestionChangeQueue(quizId)

    // If no draft exists, initialize editor from the mock adapter state.
    useEffect(() => {
        if (!quizId) return
        if (hasInitializedQuestions) return
        if (!savedQuestions) return

        const nextQuestions =
            savedQuestions.length > 0
                                ? savedQuestions.map((response) => responseToQuestion(response as any))
                : [createEmptyQuestion()]

        // avoid synchronous setState waterfall warnings by deferring
        setTimeout(() => {
            setQuestions(nextQuestions)
            setCurrentQuestionIndex((prev) => Math.min(prev, Math.max(nextQuestions.length - 1, 0)))
            setHasUnsavedChanges(false)
            setIsQuestionsReady(true)
            setHasInitializedQuestions(true)
        }, 0)
    }, [quizId, savedQuestions, hasInitializedQuestions])

    // draft persistence has been replaced by the change-queue hook

    const currentQuestion = questions[currentQuestionIndex] ?? questions[0] ?? createEmptyQuestion()
    const questionIds = useMemo(() => questions.map((question) => question.id), [questions])
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                distance: 4,
            },
        })
    )

    useEffect(
        () => () => {
            if (saveTimeoutRef.current) {
                window.clearTimeout(saveTimeoutRef.current)
            }

            if (saveSuccessHideTimeoutRef.current) {
                window.clearTimeout(saveSuccessHideTimeoutRef.current)
            }

            if (saveSuccessCleanupTimeoutRef.current) {
                window.clearTimeout(saveSuccessCleanupTimeoutRef.current)
            }

                if (reorderTimeoutRef.current) {
                    window.clearTimeout(reorderTimeoutRef.current)
                }
        },
        []
    )

    const markUnsavedChanges = (): void => {
        setHasUnsavedChanges(true)
        setIsSaveSuccessVisible(false)
        setSaveSuccess(null)

        if (saveSuccessHideTimeoutRef.current) {
            window.clearTimeout(saveSuccessHideTimeoutRef.current)
            saveSuccessHideTimeoutRef.current = null
        }

        if (saveSuccessCleanupTimeoutRef.current) {
            window.clearTimeout(saveSuccessCleanupTimeoutRef.current)
            saveSuccessCleanupTimeoutRef.current = null
        }
    }

    const reorderQuestions = (activeId: string, overId: string): void => {
        markUnsavedChanges()

        const selectedQuestionId = questions[currentQuestionIndex]?.id ?? null

            setQuestions((prevQuestions) => {
            const oldIndex = prevQuestions.findIndex((question) => question.id === activeId)
            const newIndex = prevQuestions.findIndex((question) => question.id === overId)

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
                return prevQuestions
            }

            const nextQuestions = arrayMove(prevQuestions, oldIndex, newIndex)

            if (selectedQuestionId) {
                const selectedIndex = nextQuestions.findIndex(
                    (question) => question.id === selectedQuestionId
                )
                setCurrentQuestionIndex(selectedIndex >= 0 ? selectedIndex : 0)
            }

            // schedule debounced upsert of reorder
            const newOrder = nextQuestions.map((q) => q.id)
            if (reorderTimeoutRef.current) {
                window.clearTimeout(reorderTimeoutRef.current)
            }
            reorderTimeoutRef.current = window.setTimeout(() => {
                upsertReorder(newOrder)
                reorderTimeoutRef.current = null
            }, 300)

            return nextQuestions
        })
    }

    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event

        setActiveQuestionId(null)

        if (!over || active.id === over.id) return

        reorderQuestions(String(active.id), String(over.id))
    }

    const handleDragStart = (event: DragStartEvent): void => {
        setActiveQuestionId(String(event.active.id))
    }

    const handleDragCancel = (): void => {
        setActiveQuestionId(null)
    }

    const validateQuestions = (): string | null => {
        if (!quizId) {
            return "Please create or open a quiz first so the questions can be saved in the adapter."
        }

        if (!questions.length) {
            return "Add at least one question before saving."
        }

        for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
            const question = questions[questionIndex]

            if (!question.question.trim()) {
                return `Question ${questionIndex + 1} is missing the question text.`
            }

            if (question.options.length < 2) {
                return `Question ${questionIndex + 1} needs at least two answer options.`
            }

            for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
                const option = question.options[optionIndex]
                if (!option.answer.trim()) {
                    return `Question ${questionIndex + 1}, option ${optionIndex + 1} is empty.`
                }
            }

            if (!question.options.some((option) => option.correct)) {
                return `Question ${questionIndex + 1} needs at least one correct answer.`
            }
        }

        return null
    }

    const handleSaveQuestions = async (): Promise<void> => {
        // flush queued operations and apply any created-ID mappings
        let flushResult: { items: any[]; idMap: Record<string, string> } | null = null
        try {
            flushResult = await flush()
        } catch {
            // ignore flush errors for now
        }

        // if any temp->real id mappings were returned, replace ids in UI state
        if (flushResult && flushResult.idMap && Object.keys(flushResult.idMap).length) {
            const idMap = flushResult.idMap
            setQuestions((prev) =>
                prev.map((q) => ({ ...(q as Question), id: idMap[q.id] ?? q.id }))
            )
        }
        setSaveError(null)
        setSaveSuccess(null)

        const validationError = validateQuestions()
        if (validationError) {
            setSaveError(validationError)
            return
        }

        if (!quizId) {
            setSaveError("Save the quiz first before persisting questions to the adapter.")
            return
        }

        setIsSavingQuestions(true)

        try {
            const existingQuestions = savedQuestions ?? []

            // delete existing in parallel
            await Promise.all(
                [...existingQuestions]
                    .reverse()
                    .map(async (q) => deleteQuestionMutation.mutateAsync(q.id))
            )

            // create all questions in parallel and collect responses
            const createdResponses = await Promise.all(
                questions.map(async (q) => createQuestionMutation.mutateAsync(questionToRequest(q)))
            )

            const createdQuestions = createdResponses.map((r) => responseToQuestion(r as any))

            setQuestions(createdQuestions)
            setCurrentQuestionIndex((prev) =>
                Math.min(prev, Math.max(createdQuestions.length - 1, 0))
            )
            setHasUnsavedChanges(false)
            setSaveSuccess("Quiz changes saved.")
            setIsSaveSuccessVisible(true)

            if (saveSuccessHideTimeoutRef.current) {
                window.clearTimeout(saveSuccessHideTimeoutRef.current)
            }

            if (saveSuccessCleanupTimeoutRef.current) {
                window.clearTimeout(saveSuccessCleanupTimeoutRef.current)
            }

            saveSuccessHideTimeoutRef.current = window.setTimeout(() => {
                setIsSaveSuccessVisible(false)

                saveSuccessCleanupTimeoutRef.current = window.setTimeout(() => {
                    setSaveSuccess(null)
                }, 650)
            }, 5000)

            if (typeof window !== "undefined") {
                if (saveTimeoutRef.current) {
                    window.clearTimeout(saveTimeoutRef.current)
                }
                saveTimeoutRef.current = null
            }
        } catch (err) {
            setSaveError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while saving the questions."
            )
        } finally {
            setIsSavingQuestions(false)
        }
    }

    const handleDelete = async (): Promise<void> => {
        if (!quizId) return

        try {
            setDeleteError(null)
            await deleteQuizMutation.mutateAsync(quizId)
            setIsConfirmOpen(false)
            navigate("/dashboard")
        } catch {
            setDeleteError("Quiz could not be deleted. Please try again.")
        }
    }

    const handleEditSuccess = (): void => {
        // Quiz data is automatically updated by React Query
        setIsEditModalOpen(false)
    }

    const updateQuestion = (data: Partial<Question>) => {
        markUnsavedChanges()
        setQuestions((prevQuestions) => {
            const updated = [...prevQuestions]
            const next = { ...updated[currentQuestionIndex], ...data }

            updated[currentQuestionIndex] = next

            // coalesce update for this question (API shape)
            upsertUpdate(next.id, questionToRequest(next))

            return updated
        })
    }

    const updateOption = (index: number, value: string) => {
        markUnsavedChanges()
        const newOptions = [...currentQuestion.options]

        newOptions[index] = {
            ...newOptions[index],
            answer: value,
        }

        updateQuestion({ options: newOptions })

        // updateQuestion already upserts the change
    }

    const toggleOptionCorrect = (index: number) => {
        markUnsavedChanges()
        // Allow toggling independently in the editor regardless of question type
        const newOptions = currentQuestion.options.map((option, optionIndex) =>
            optionIndex === index ? { ...option, correct: !option.correct } : option
        )

        updateQuestion({ options: newOptions })

        // updateQuestion already upserts the change
    }

    const deleteQuestion = (indexToDelete: number) => {
        markUnsavedChanges()
        if (questions.length === 1) {
            setQuestions([createEmptyQuestion()])
            setCurrentQuestionIndex(0)
            return
        }

        const deletingId = questions[indexToDelete]?.id
        setQuestions((prevQuestions) => prevQuestions.filter((_, index) => index !== indexToDelete))

        if (deletingId) {
            enqueue({
                id: crypto.randomUUID(),
                op: "delete",
                quizId: quizId ?? "new",
                questionId: deletingId,
                createdAt: new Date().toISOString(),
            })
        }

        if (currentQuestionIndex >= indexToDelete && currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1)
        }
    }

    const handleAddQuestion = () => {
        markUnsavedChanges()
        const newQ = createEmptyQuestion()
        setQuestions((prev) => [...prev, newQ])

        enqueue({
            id: crypto.randomUUID(),
            op: "create",
            quizId: quizId ?? "new",
            questionId: newQ.id,
            payload: questionToRequest(newQ),
            createdAt: new Date().toISOString(),
        })
    }

    const handleAddOption = () => {
        markUnsavedChanges()
        const newOption = { id: crypto.randomUUID(), answer: "", correct: false }
        const updatedQuestion = {
            ...currentQuestion,
            options: [...currentQuestion.options, newOption],
        }
        updateQuestion({ options: updatedQuestion.options })

        // updateQuestion already upserts the change
    }

    const handleDeleteOption = (indexToDelete: number) => {
        if (currentQuestion.options.length <= 2) return

        markUnsavedChanges()

        updateQuestion({
            options: currentQuestion.options.filter((_, index) => index !== indexToDelete),
        })
    }

    const handleConfirmClose = () => setIsConfirmOpen(false)

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
            <div className="flex w-full flex-col px-4 py-8 sm:px-8">
                {/* Header */}
                <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold md:text-5xl">{quizTitle}</h1>
                            <Button
                                aria-label="Edit title"
                                className="text-muted-foreground hover:text-foreground p-2"
                                onClick={() => setIsEditModalOpen(true)}
                                type="button"
                                variant="ghost"
                            >
                                <Edit2 className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="mt-3 flex items-start gap-3">
                            <p className="max-w-2xl text-base whitespace-pre-wrap">
                                {quizDescription}
                            </p>
                            <Button
                                aria-label="Edit description"
                                className="text-muted-foreground hover:text-foreground p-2"
                                onClick={() => setIsEditModalOpen(true)}
                                type="button"
                                variant="ghost"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            className="border-border bg-muted/40 hover:bg-muted/70 gap-2 border backdrop-blur-sm"
                            variant="ghost"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>

                        <Button
                            className="bg-[#00F2FF] font-bold text-black hover:bg-[#00d8e4]"
                            disabled={isSavingQuestions || (quizId ? isLoadingQuestions : false)}
                            onClick={() => {
                                handleSaveQuestions().catch(() => {})
                            }}
                        >
                            {isSavingQuestions ? "Saving..." : "Save Quiz"}
                        </Button>

                        {quizId ? (
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => setIsConfirmOpen(true)}
                                variant="ghost"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Quiz
                            </Button>
                        ) : null}
                        <Dialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Quiz?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. Are you sure you want to
                                        delete the quiz?
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogFooter>
                                    <Button onClick={handleConfirmClose} variant="outline">
                                        Abbrechen
                                    </Button>
                                    <Button
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => {
                                            handleDelete().catch(() => {})
                                        }}
                                    >
                                        Löschen
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>

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

                {(quizId && !isQuestionsReady) ||
                (isLoadingQuestions && quizId && !hasInitializedQuestions) ? (
                    <p className="text-muted-foreground mb-6 text-sm">Loading questions...</p>
                ) : null}

                {deleteError ? <p className="mb-6 text-sm text-red-500">{deleteError}</p> : null}

                {saveError ? <p className="mb-6 text-sm text-red-500">{saveError}</p> : null}

                {/* queue error banner removed per UX request */}

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

                {/* Layout */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr_320px]">
                    {/* Sidebar */}
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragCancel={handleDragCancel}
                        onDragEnd={handleDragEnd}
                        onDragStart={handleDragStart}
                        sensors={sensors}
                    >
                        <div className="bg-muted/30 border-border flex h-full min-h-0 flex-col rounded-3xl border p-4 shadow-xl backdrop-blur-sm">
                            <QuestionSidebar
                                activeIndex={currentQuestionIndex}
                                onAdd={handleAddQuestion}
                                onDelete={deleteQuestion}
                                onSelect={setCurrentQuestionIndex}
                                questionIds={questionIds}
                                questions={questions}
                            />
                        </div>

                        <DragOverlay dropAnimation={null}>
                            {activeQuestionId
                                ? (() => {
                                      const activeQuestion = questions.find(
                                          (question) => question.id === activeQuestionId
                                      )

                                      if (!activeQuestion) return null

                                      return (
                                          <div className="border-border bg-muted/95 w-[280px] rounded-2xl border p-4 shadow-2xl">
                                              <div className="mb-3 flex items-center gap-2">
                                                  <div className="text-muted-foreground/60 flex h-9 w-9 items-center justify-center rounded-md bg-white/5">
                                                      <span className="text-lg">⋮⋮</span>
                                                  </div>
                                                  <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                                                      Question
                                                  </span>
                                              </div>

                                              <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold">
                                                  {activeQuestion.question || "Untitled question"}
                                              </p>

                                              <div className="grid grid-cols-2 gap-1.5 opacity-80">
                                                  <div className="h-2 rounded-full bg-[#2d4cc9]" />
                                                  <div className="h-2 rounded-full bg-[#ffa602]" />
                                                  <div className="h-2 rounded-full bg-[#11c8d4]" />
                                                  <div className="h-2 rounded-full bg-[#ff4949]" />
                                              </div>
                                          </div>
                                      )
                                  })()
                                : null}
                        </DragOverlay>
                    </DndContext>

                    <QuestionEditor
                        onAddOption={handleAddOption}
                        onChangeOption={updateOption}
                        onDeleteOption={handleDeleteOption}
                        onToggleCorrect={toggleOptionCorrect}
                        question={currentQuestion}
                        questionIndex={currentQuestionIndex}
                        totalQuestions={questions.length}
                        updateQuestion={updateQuestion}
                    />

                    {/* Settings */}
                    <div className="bg-muted/30 border-border rounded-3xl border p-4 shadow-xl backdrop-blur-sm">
                        <SettingsPanel question={currentQuestion} />
                    </div>
                </div>
            </div>
            <CreateQuizModal
                initialDescription={quizDescription}
                initialTitle={quizTitle}
                isOpen={isEditModalOpen}
                mode={modalMode}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                quizId={quizId}
            />
        </div>
    )
}
