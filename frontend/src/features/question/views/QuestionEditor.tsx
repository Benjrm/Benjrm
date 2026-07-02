import type { JSX } from "react"
import { useState, useEffect } from "react"
import MDEditor from "@uiw/react-md-editor"
import { useTranslation } from "react-i18next"
import QuestionAnswerOptions from "./QuestionAnswerOptions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shadcn/components/ui/select"
import { Textarea } from "@/shadcn/components/ui/textarea"
import { Button } from "@/shadcn/components/ui/button"
import type { QuestionType, Question } from "@/features/question/types/questions.ts"
import updateQuestionWithPatch from "@/features/question/utils/updateQuestionWithPatch.ts"
import questionTypes from "@/features/question/constants/questionTypes.ts"
import type { QuestionError } from "@/features/question/types/questionError.ts"
import useTheme from "@/shared/hooks/useTheme.ts"

interface QuestionEditorProps {
    question: Question
    questionIndex: number
    totalQuestions: number
    questionError: QuestionError
    bigQuestionError: string | null
    updateQuestion: (data: Question) => void
    onAddOption: () => void
    onChangeOption: (index: number, value: string) => void
    onDeleteOption: (index: number) => void
    onToggleCorrect: (index: number) => void
    onReorderOptions: (activeId: string, overId: string) => void
}

export default function QuestionEditor({
    question,
    questionIndex,
    totalQuestions,
    questionError,
    bigQuestionError,
    updateQuestion,
    onAddOption,
    onChangeOption,
    onDeleteOption,
    onToggleCorrect,
    onReorderOptions,
}: QuestionEditorProps): JSX.Element {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const [isMdEditor, setIsMdEditor] = useState(() => {
        const saved = localStorage.getItem("preferredEditorMode")
        if (saved !== null) {
            return saved === "markdown"
        }
        return question.type === "SLIDE"
    })

    useEffect(() => {
        localStorage.setItem("preferredEditorMode", isMdEditor ? "markdown" : "visual")
    }, [isMdEditor])

    return (
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            {bigQuestionError ? (
                <div className="text-black-950 dark:text-white-200 rounded-2xl border border-red-400 bg-red-50 px-4 py-3 text-sm font-medium shadow-sm dark:border-red-400/30 dark:bg-red-500/10">
                    {bigQuestionError}
                </div>
            ) : null}
            {/* Question Card */}
            <div className="bg-background/90 dark:bg-muted/30 border-border relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-sm md:p-8">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#00F2FF]/10 blur-3xl" />

                <div className="relative">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <div className="text-muted-foreground text-sm font-medium tracking-wide">
                                {question.type === "SLIDE"
                                    ? t("quizEditor.editor.slide")
                                    : t("quizEditor.editor.question")}{" "}
                                {questionIndex + 1} {t("quizEditor.editor.of")} {totalQuestions}
                            </div>
                            <Button
                                className="h-7 px-3 text-xs"
                                onClick={() => setIsMdEditor(!isMdEditor)}
                                size="sm"
                                variant="outline"
                            >
                                {isMdEditor
                                    ? t("quizEditor.editor.usePlainInput")
                                    : t("quizEditor.editor.useMarkdownEditor")}
                            </Button>
                        </div>

                        <Select
                            value={question.type}
                            onValueChange={(val: QuestionType) =>
                                updateQuestion(updateQuestionWithPatch(question, { type: val }))
                            }
                        >
                            <SelectTrigger className="bg-background/70 border-border w-52 backdrop-blur-sm">
                                <SelectValue placeholder={t("quizEditor.editor.selectType")} />
                            </SelectTrigger>

                            <SelectContent>
                                {questionTypes.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {t(`quizEditor.editor.types.${value}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative w-full">
                        {isMdEditor ? (
                            <div
                                data-color-mode={theme === "auto" ? "auto" : theme}
                                className={`[&_.w-md-editor-toolbar]:!border-border mt-4 overflow-hidden rounded-xl border shadow-sm [&_.w-md-editor]:!shadow-none [&_.w-md-editor-text]:h-full [&_.w-md-editor-toolbar]:!border-b [&_.w-md-editor-toolbar]:!bg-transparent [&_.wmde-markdown-color]:!bg-transparent ${
                                    questionError.missingQuestion
                                        ? "border-red-400 dark:border-red-400/30"
                                        : "border-border"
                                }`}
                            >
                                <MDEditor
                                    height={question.type === "SLIDE" ? 320 : 200}
                                    preview="edit"
                                    value={question.question}
                                    className={
                                        questionError.missingQuestion
                                            ? "bg-red-50! dark:bg-red-500/10!"
                                            : "bg-muted/90! dark:bg-muted/25!"
                                    }
                                    onChange={(val) =>
                                        updateQuestion(
                                            updateQuestionWithPatch(question, {
                                                question: val ?? "",
                                            })
                                        )
                                    }
                                    textareaProps={{
                                        placeholder:
                                            question.type === "SLIDE"
                                                ? t("quizEditor.editor.slidePlaceholderMd")
                                                : t("quizEditor.editor.questionPlaceholderMd"),
                                    }}
                                />
                            </div>
                        ) : (
                            <Textarea
                                value={question.question}
                                className={`placeholder:text-muted-foreground/40 min-h-40 resize-none p-4 text-3xl leading-tight font-bold shadow-none focus-visible:ring-0 md:text-4xl ${
                                    questionError.missingQuestion
                                        ? "border-red-400! bg-red-50 dark:border-red-400/30! dark:bg-red-500/10"
                                        : "bg-muted/90 dark:bg-muted/25 border-none"
                                }`}
                                onChange={(e) =>
                                    updateQuestion(
                                        updateQuestionWithPatch(question, {
                                            question: e.target.value,
                                        })
                                    )
                                }
                                placeholder={
                                    question.type === "SLIDE"
                                        ? t("quizEditor.editor.slidePlaceholder")
                                        : t("quizEditor.editor.questionPlaceholder")
                                }
                            />
                        )}
                        {questionError.missingQuestion ? (
                            <div className="absolute right-0 bottom-0 left-0 mx-2 mb-1 text-sm font-medium text-red-500">
                                {t("quizEditor.editor.fieldRequired")}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Answers / Editor for choice-based questions */}
            {question.type !== "SLIDE" ? (
                <QuestionAnswerOptions
                    errorMissingAnswers={questionError.missingAnswers}
                    isMdEditor={isMdEditor}
                    onAddOption={onAddOption}
                    onChange={onChangeOption}
                    onDeleteOption={onDeleteOption}
                    onReorderOptions={onReorderOptions}
                    onToggleCorrect={onToggleCorrect}
                    options={question.options}
                    type={question.type}
                />
            ) : null}
        </main>
    )
}
