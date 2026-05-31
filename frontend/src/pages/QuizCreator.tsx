// frontend/src/pages/QuizCreator.tsx

import type { JSX } from "react"
import { useState } from "react"
import { Edit2, Settings, Trash2 } from "lucide-react"
import { useParams, useNavigate } from "react-router"

import AnswerCard from "../components/AnswerCard"
import CreateQuizModal from "../components/CreateQuizModal"
import QuestionSidebar from "../components/QuestionSidebar"
import SettingsPanel from "../components/SettingsPanel"
import type { Question } from "../types/quiz"
import { useQuiz, useDeleteQuiz } from "@/api/queries"

import { Button } from "@/shadcn/components/ui/button"
import { Textarea } from "@/shadcn/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shadcn/components/ui/select"
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

// --- Main Page ---

export default function QuizCreator(): JSX.Element {
    const { quizId } = useParams()
    const navigate = useNavigate()
    const modalMode = quizId ? "edit" : "create"

    // Query for loading quiz data
    const { data: quiz, isLoading, error } = useQuiz(quizId)
    const deleteQuizMutation = useDeleteQuiz()

    // Derived values
    const quizTitle = quiz?.title ?? "Untitled"
    const quizDescription = quiz?.description ?? ""
    const quizLoadError = getReadableQuizErrorMessage(error)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const [questions, setQuestions] = useState<Question[]>([
        {
            id: 1,
            options: ["", "", "", ""],
            title: "",
            type: "Multiple Choice",
        },
    ])

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)

    const currentQuestion = questions[currentQuestionIndex]

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
        setQuestions((prevQuestions) => {
            const updated = [...prevQuestions]

            updated[currentQuestionIndex] = {
                ...updated[currentQuestionIndex],
                ...data,
            }

            return updated
        })
    }

    const updateOption = (index: number, value: string) => {
        const newOptions = [...currentQuestion.options]

        newOptions[index] = value

        updateQuestion({ options: newOptions })
    }

    const deleteQuestion = (indexToDelete: number) => {
        if (questions.length === 1) {
            setQuestions([
                {
                    id: Date.now(),
                    options: ["", "", "", ""],
                    title: "",
                    type: "Multiple Choice",
                },
            ])
            setCurrentQuestionIndex(0)
            return
        }

        setQuestions((prevQuestions) => prevQuestions.filter((_, index) => index !== indexToDelete))

        if (currentQuestionIndex >= indexToDelete && currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1)
        }
    }

    const handleAddQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                id: Date.now(),
                options: ["", "", "", ""],
                title: "",
                type: "Multiple Choice",
            },
        ])
    }

    const handleSelectType = (value: string) => {
        updateQuestion({
            type: value as Question["type"],
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

                        <Button className="bg-[#00F2FF] font-bold text-black hover:bg-[#00d8e4]">
                            Save Quiz
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

                {quizLoadError && quizId ? (
                    <p className="mb-6 text-sm text-red-500">{quizLoadError}</p>
                ) : null}

                {isLoading && quizId ? (
                    <p className="text-muted-foreground mb-6 text-sm">Loading quiz...</p>
                ) : null}

                {deleteError ? <p className="mb-6 text-sm text-red-500">{deleteError}</p> : null}

                {/* Layout */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr_320px]">
                    {/* Sidebar */}
                    <div className="bg-muted/30 border-border rounded-3xl border p-4 shadow-xl backdrop-blur-sm">
                        <QuestionSidebar
                            activeIndex={currentQuestionIndex}
                            onAdd={handleAddQuestion}
                            onDelete={deleteQuestion}
                            onSelect={setCurrentQuestionIndex}
                            questions={questions}
                        />
                    </div>

                    {/* Main Editor */}
                    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                        {/* Question Card */}
                        <div className="bg-muted/30 border-border relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-sm md:p-8">
                            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />

                            <div className="relative">
                                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="text-muted-foreground text-sm font-medium tracking-wide">
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </div>

                                    <Select
                                        onValueChange={handleSelectType}
                                        value={currentQuestion.type}
                                    >
                                        <SelectTrigger className="bg-background/70 border-border w-52 backdrop-blur-sm">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Multiple Choice">
                                                Multiple Choice
                                            </SelectItem>

                                            <SelectItem value="True/False">True/False</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Textarea
                                    className="placeholder:text-muted-foreground/40 min-h-40 resize-none border-none bg-transparent p-0 text-3xl leading-tight font-bold shadow-none focus-visible:ring-0 md:text-4xl"
                                    placeholder="Type your question here..."
                                    value={currentQuestion.title}
                                    onChange={(e) =>
                                        updateQuestion({
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {/* Answers */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <AnswerCard
                                accent="#2d4cc9"
                                glow="radial-gradient(circle, #2d4cc9 0%, transparent 70%)"
                                icon="▲"
                                onChange={(val) => updateOption(0, val)}
                                placeholder="Option 1"
                                value={currentQuestion.options[0]}
                            />

                            <AnswerCard
                                accent="#ffa602"
                                glow="radial-gradient(circle, #ffa602 0%, transparent 70%)"
                                icon="◆"
                                onChange={(val) => updateOption(1, val)}
                                placeholder="Option 2"
                                value={currentQuestion.options[1]}
                            />

                            <AnswerCard
                                accent="#11c8d4"
                                glow="radial-gradient(circle, #11c8d4 0%, transparent 70%)"
                                icon="●"
                                onChange={(val) => updateOption(2, val)}
                                placeholder="Option 3"
                                value={currentQuestion.options[2]}
                            />

                            <AnswerCard
                                accent="#ff4949"
                                glow="radial-gradient(circle, #ff4949 0%, transparent 70%)"
                                icon="■"
                                onChange={(val) => updateOption(3, val)}
                                placeholder="Option 4"
                                value={currentQuestion.options[3]}
                            />
                        </div>
                    </main>

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
