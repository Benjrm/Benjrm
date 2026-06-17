// frontend/src/pages/QuizCreator.tsx

import type { JSX } from "react"
import { useState, useEffect } from "react"
import { Edit2, Settings, Trash2 } from "lucide-react"
import { useParams, useNavigate } from "react-router"
import { toast, Toaster } from "sonner"
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"

import CreateQuizModal from "../components/CreateQuizModal"
import QuestionEditor from "../components/QuestionEditor"
import QuestionSidebar from "../components/QuestionSidebar"
import SettingsPanel from "../components/SettingsPanel"
import {
    restrictToVerticalAxis,
    restrictToParentElement,
    getQuestionPreviewText,
} from "./quiz/quizUtils"
import { PlayQuizButton } from "@/components/PlayQuizButton"
import { Button } from "@/shadcn/components/ui/button"
import useQuizEditor from "@/hooks/useQuizEditor"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/components/ui/dialog"
import { QuestionTypeEnum } from "@/api/questions/types/questionType"

export default function QuizCreator(): JSX.Element {
    const params = useParams()
    const quizId = params.id ?? params.quizId
    const navigate = useNavigate()

    const {
        quizTitle,
        quizDescription,
        isLoading,
        isLoadingQuestions,
        questionLoadError,
        error,
        questionError,
        bigQuestionError,
        questions,
        isQuizPlayable,
        currentQuestionIndex,
        handleSelectQuestion,
        currentQuestion,
        questionIds,
        activeQuestionId,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
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
        deleteQuizMutation,
        discardChanges,
        hasInitializedQuestions,
    } = useQuizEditor(quizId)

    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        if (isLoading && quizId) {
            toast.loading("Loading quiz...", { id: "quiz-loading" })
        } else {
            toast.dismiss("quiz-loading")
            if (error && quizId) {
                const msg = error instanceof Error ? error.message : String(error)
                toast.error(msg, { id: "quiz-error" })
            }
        }
    }, [isLoading, error, quizId])

    useEffect(() => {
        if (isLoadingQuestions && quizId && !hasInitializedQuestions) {
            toast.loading("Loading questions...", { id: "questions-loading" })
        } else {
            toast.dismiss("questions-loading")
            if (questionLoadError) {
                toast.error("Failed to load questions.", { id: "questions-error" })
            }
        }
    }, [isLoadingQuestions, questionLoadError, quizId, hasInitializedQuestions])

    useEffect(() => {
        if (hasUnsavedChanges) {
            toast.warning("There are still unsaved changes. Click Save Quiz to save them.", {
                id: "unsaved-changes",
                duration: Infinity,
            })
        } else {
            toast.dismiss("unsaved-changes")
        }
    }, [hasUnsavedChanges])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { distance: 4 } })
    )

    // UI-only state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const handleDelete = async (): Promise<void> => {
        if (!quizId) return

        try {
            await deleteQuizMutation.mutateAsync(quizId)
            setIsConfirmOpen(false)
            navigate("/dashboard")
        } catch {
            toast.error("Quiz could not be deleted. Please try again.")
        }
    }

    const handleEditSuccess = (): void => setIsEditModalOpen(false)

    const handleConfirmClose = () => setIsConfirmOpen(false)

    return (
        <div className="bg-background text-foreground flex flex-col overflow-hidden px-4 py-6 sm:px-8 lg:absolute lg:inset-0">
            <div className="flex w-full flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="mb-6 flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                        <PlayQuizButton disabled={!isQuizPlayable} quizId={quizId} />
                        <Button
                            className="border-border bg-muted/40 hover:bg-muted/70 gap-2 border backdrop-blur-sm"
                            variant="ghost"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>

                        {hasUnsavedChanges ? (
                            <Button
                                disabled={isSavingQuestions}
                                onClick={discardChanges}
                                variant="outline"
                            >
                                Discard Changes
                            </Button>
                        ) : null}

                        <Button
                            className="bg-[#00F2FF] font-bold text-black hover:bg-[#00d8e4]"
                            disabled={isSavingQuestions || (quizId ? isLoadingQuestions : false)}
                            onClick={() => {
                                handleSaveQuestions()
                                    .then((res) => {
                                        if (res.error) setSaveError(res.error)
                                        else setSaveError(null)
                                    })
                                    .catch(() => {})
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

                {saveError ? (
                    <div className="text-black-950 dark:text-white-200 mb-6 rounded-2xl border border-red-400 bg-red-50 px-4 py-3 text-sm font-medium shadow-sm dark:border-red-400/30 dark:bg-red-500/10">
                        {saveError}
                    </div>
                ) : null}

                {/* Layout */}
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
                    {/* Sidebar */}
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        onDragCancel={handleDragCancel}
                        onDragEnd={handleDragEnd}
                        onDragStart={handleDragStart}
                        sensors={sensors}
                    >
                        <div className="bg-muted/30 border-border custom-scrollbar flex h-full min-h-0 flex-col overflow-y-auto rounded-3xl border p-4 shadow-xl backdrop-blur-sm">
                            <QuestionSidebar
                                activeIndex={currentQuestionIndex}
                                onAdd={handleAddQuestion}
                                onDelete={deleteQuestion}
                                onSelect={handleSelectQuestion}
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
                                                      {activeQuestion.type ===
                                                      QuestionTypeEnum.SLIDE
                                                          ? "Slide"
                                                          : "Question"}
                                                  </span>
                                              </div>

                                              <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold">
                                                  {getQuestionPreviewText(
                                                      activeQuestion.question,
                                                      activeQuestion.type
                                                  )}
                                              </p>

                                              {activeQuestion.type !== QuestionTypeEnum.SLIDE ? (
                                                  <div className="grid grid-cols-2 gap-1.5 opacity-80">
                                                      <div className="h-2 rounded-full bg-[#2d4cc9]" />
                                                      <div className="h-2 rounded-full bg-[#ffa602]" />
                                                      <div className="h-2 rounded-full bg-[#11c8d4]" />
                                                      <div className="h-2 rounded-full bg-[#ff4949]" />
                                                  </div>
                                              ) : null}
                                          </div>
                                      )
                                  })()
                                : null}
                        </DragOverlay>
                    </DndContext>

                    <div className="custom-scrollbar h-auto overflow-y-auto rounded-3xl px-1">
                        <QuestionEditor
                            bigQuestionError={bigQuestionError}
                            onAddOption={handleAddOption}
                            onChangeOption={updateOption}
                            onDeleteOption={handleDeleteOption}
                            onReorderOptions={reorderOptions}
                            onToggleCorrect={toggleOptionCorrect}
                            question={currentQuestion}
                            questionError={questionError}
                            questionIndex={currentQuestionIndex}
                            totalQuestions={questions.length}
                            updateQuestion={updateQuestion}
                        />
                    </div>

                    {/* Settings */}
                    <div className="bg-muted/30 border-border custom-scrollbar hidden h-auto overflow-y-auto rounded-3xl border p-4 shadow-xl backdrop-blur-sm xl:block">
                        <SettingsPanel question={currentQuestion} />
                    </div>
                </div>
            </div>
            <CreateQuizModal
                initialDescription={quizDescription}
                initialTitle={quizTitle}
                isOpen={isEditModalOpen}
                mode="edit"
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                quizId={quizId}
            />
            <Toaster richColors position="bottom-right" />
        </div>
    )
}
