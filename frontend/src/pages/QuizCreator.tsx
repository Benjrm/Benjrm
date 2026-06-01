// frontend/src/pages/QuizCreator.tsx

import type { JSX } from "react"
import { useState } from "react"
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

import CreateQuizModal from "../components/CreateQuizModal"
import QuestionEditor from "../components/QuestionEditor"
import QuestionSidebar from "../components/QuestionSidebar"
import SettingsPanel from "../components/SettingsPanel"
import QuizCreatorFeedback from "../components/QuizCreatorFeedback"
import { restrictToVerticalAxis } from "./quiz/quizUtils"
import useQuizEditor from "@/hooks/useQuizEditor"
import { Button } from "@/shadcn/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/components/ui/dialog"

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
        questions,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        currentQuestion,
        questionIds,
        activeQuestionId,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
        updateQuestion,
        updateOption,
        toggleOptionCorrect,
        deleteQuestion,
        handleAddQuestion,
        handleAddOption,
        handleDeleteOption,
        handleSaveQuestions,
        isSavingQuestions,
        saveSuccess,
        saveError,
        isSaveSuccessVisible,
        hasUnsavedChanges,
        deleteQuizMutation,
        hasInitializedQuestions,
    } = useQuizEditor(quizId)

    // normalize errors to strings to avoid nested ternaries in JSX
    let questionLoadErrorStr: string | null = null
    if (typeof questionLoadError === "string") questionLoadErrorStr = questionLoadError
    else if (questionLoadError instanceof Error) questionLoadErrorStr = questionLoadError.message

    let quizLoadErrorStr: string | null = null
    if (typeof error === "string") quizLoadErrorStr = error
    else if (error instanceof Error) quizLoadErrorStr = error.message

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { distance: 4 } })
    )

    // UI-only state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

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

    const handleEditSuccess = (): void => setIsEditModalOpen(false)

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

                <QuizCreatorFeedback
                    deleteError={deleteError}
                    hasInitializedQuestions={hasInitializedQuestions}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isLoading={isLoading}
                    isLoadingQuestions={isLoadingQuestions}
                    isSaveSuccessVisible={isSaveSuccessVisible}
                    questionLoadError={questionLoadErrorStr}
                    quizId={quizId}
                    quizLoadError={quizLoadErrorStr}
                    saveError={saveError}
                    saveSuccess={saveSuccess}
                />

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
                mode="edit"
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                quizId={quizId}
            />
        </div>
    )
}
