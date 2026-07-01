import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Edit2, Settings, Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shadcn/components/ui/dialog.tsx"
import { Button } from "@shadcn/components/ui/button.tsx"
import { PlayQuizButton } from "@/features/quiz/views/PlayQuizButton.tsx"

interface QuizCreatorHeaderProps {
    setIsEditModalOpen: (value: boolean) => void
    quizTitle: string
    quizDescription: string
    quizId?: string
    hasUnsavedChanges: boolean
    isSavingQuestions: boolean
    discardChanges: () => void
    isLoadingQuestions: boolean
    handleSaveQuestions: () => Promise<{ ok: boolean; error?: string }>
    setSaveError: (value: string | null) => void
    setIsConfirmOpen: (value: boolean) => void
    isConfirmOpen: boolean
    handleDelete: () => Promise<void>
}

export default function QuizCreatorHeader({
    setIsEditModalOpen,
    quizTitle,
    quizDescription,
    quizId,
    hasUnsavedChanges,
    isSavingQuestions,
    discardChanges,
    isLoadingQuestions,
    handleSaveQuestions,
    setSaveError,
    setIsConfirmOpen,
    isConfirmOpen,
    handleDelete,
}: QuizCreatorHeaderProps): ReactNode {
    const { t } = useTranslation()
    const handleConfirmClose = () => setIsConfirmOpen(false)

    return (
        <header className="mb-6 flex shrink-0 flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-extrabold md:text-5xl">{quizTitle}</h1>
                    <Button
                        aria-label={t("quizEditor.header.editTitle")}
                        className="text-muted-foreground hover:text-foreground p-2"
                        onClick={() => setIsEditModalOpen(true)}
                        type="button"
                        variant="ghost"
                    >
                        <Edit2 className="h-5 w-5" />
                    </Button>
                </div>
                {quizDescription !== "" ? (
                    <div className="mt-3 flex items-center gap-3">
                        <p className="max-w-2xl text-base whitespace-pre-wrap">{quizDescription}</p>
                        <Button
                            aria-label={t("quizEditor.header.editDescription")}
                            className="text-muted-foreground hover:text-foreground p-2"
                            onClick={() => setIsEditModalOpen(true)}
                            type="button"
                            variant="ghost"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <PlayQuizButton quizId={quizId} />
                <Button
                    className="border-border bg-muted/40 hover:bg-muted/70 gap-2 border backdrop-blur-sm"
                    variant="ghost"
                >
                    <Settings className="h-4 w-4" />
                    {t("quizEditor.header.settings")}
                </Button>

                {hasUnsavedChanges ? (
                    <Button disabled={isSavingQuestions} onClick={discardChanges} variant="outline">
                        {t("quizEditor.header.discardChanges")}
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
                    {isSavingQuestions
                        ? t("quizEditor.header.saving")
                        : t("quizEditor.header.saveQuiz")}
                </Button>

                {quizId ? (
                    <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => setIsConfirmOpen(true)}
                        variant="ghost"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("quizEditor.header.deleteQuiz")}
                    </Button>
                ) : null}
                <Dialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("quizEditor.deleteModal.title")}</DialogTitle>
                            <DialogDescription>
                                {t("quizEditor.deleteModal.description")}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button onClick={handleConfirmClose} variant="outline">
                                {t("common.buttons.cancel")}
                            </Button>
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => {
                                    handleDelete().catch(() => {})
                                }}
                            >
                                {t("common.buttons.delete")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
    )
}
