// frontend/src/pages/QuizCreator.tsx

import type { JSX } from "react"
import { useState, useEffect } from "react"
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

import { useTranslation } from "react-i18next"
import CreateQuizModal from "../components/CreateQuizModal"
import QuestionEditor from "../components/QuestionEditor"
import QuestionSidebar from "../components/QuestionSidebar"
import SettingsPanel from "../components/SettingsPanel"
import {
    restrictToVerticalAxis,
    restrictToParentElement,
    getQuestionPreviewText,
} from "./quiz/quizUtils"
import useQuizEditor from "@/hooks/useQuizEditor"
import { QuestionTypeEnum } from "@/api/questions/types/questionType"
import QuizCreatorHeader from "@/components/QuizCreatorHeader.tsx"

export default function QuizCreator(): JSX.Element {
    const { t } = useTranslation()
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
            toast.loading(t("quizEditor.toasts.loadingQuiz"), { id: "quiz-loading" })
        } else {
            toast.dismiss("quiz-loading")
            if (error && quizId) {
                const msg = error instanceof Error ? error.message : String(error)
                toast.error(msg, { id: "quiz-error" })
            }
        }
    }, [isLoading, error, quizId, t])

    useEffect(() => {
        if (isLoadingQuestions && quizId && !hasInitializedQuestions) {
            toast.loading(t("quizEditor.toasts.loadingQuestions"), { id: "questions-loading" })
        } else {
            toast.dismiss("questions-loading")
            if (questionLoadError) {
                toast.error(t("quizEditor.toasts.loadQuestionsError"), { id: "questions-error" })
            }
        }
    }, [isLoadingQuestions, questionLoadError, quizId, hasInitializedQuestions, t])

    useEffect(() => {
        if (hasUnsavedChanges) {
            toast.warning(t("quizEditor.toasts.unsavedChanges"), {
                id: "unsaved-changes",
                duration: Infinity,
            })
        } else {
            toast.dismiss("unsaved-changes")
        }
    }, [hasUnsavedChanges, t])

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
            toast.error(t("quizEditor.toasts.deleteError"))
        }
    }

    const handleEditSuccess = (): void => setIsEditModalOpen(false)

    return (
        <div className="bg-background text-foreground flex flex-col overflow-hidden px-4 py-6 sm:px-8 lg:absolute lg:inset-0">
            <div className="flex w-full flex-1 flex-col overflow-hidden">
                <QuizCreatorHeader
                    discardChanges={discardChanges}
                    handleDelete={handleDelete}
                    handleSaveQuestions={handleSaveQuestions}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isConfirmOpen={isConfirmOpen}
                    isLoadingQuestions={isLoadingQuestions}
                    isSavingQuestions={isSavingQuestions}
                    quizDescription={quizDescription}
                    quizId={quizId}
                    quizTitle={quizTitle}
                    setIsConfirmOpen={setIsConfirmOpen}
                    setIsEditModalOpen={setIsEditModalOpen}
                    setSaveError={setSaveError}
                />

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
                                                      {/* eslint-disable-next-line i18next/no-literal-string */}
                                                      <span className="text-lg">⋮⋮</span>
                                                  </div>
                                                  <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                                                      {activeQuestion.type ===
                                                      QuestionTypeEnum.SLIDE
                                                          ? t("quizEditor.editor.slide")
                                                          : t("quizEditor.editor.question")}
                                                  </span>
                                              </div>

                                              <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold">
                                                  {getQuestionPreviewText(
                                                      activeQuestion.question,
                                                      activeQuestion.type,
                                                      t
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
