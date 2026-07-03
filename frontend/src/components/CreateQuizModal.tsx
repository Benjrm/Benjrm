// frontend/src/components/CreateQuizModal.tsx

import type { FC } from "react"
import { useTranslation } from "react-i18next"
import QuizForm from "./QuizForm"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/components/ui/dialog"

interface CreateQuizModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (quizId?: string) => void
    initialDescription?: string
    initialTitle?: string
    mode?: "create" | "edit"
    quizId?: string
}

const CreateQuizModal: FC<CreateQuizModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    mode = "create",
    initialTitle = "",
    initialDescription = "",
    quizId,
}) => {
    const { t } = useTranslation()
    const dialogTitle = mode === "edit" ? t("quiz.modal.editTitle") : t("quiz.modal.createTitle")
    const dialogDescription =
        mode === "edit" ? t("quiz.modal.editDescription") : t("quiz.modal.createDescription")

    const formKey = [mode, quizId ?? "new", initialTitle, initialDescription].join("|")

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose()
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>
                <QuizForm
                    key={formKey}
                    initialDescription={initialDescription}
                    initialTitle={initialTitle}
                    mode={mode}
                    onClose={onClose}
                    onSuccess={onSuccess}
                    quizId={quizId}
                />
            </DialogContent>
        </Dialog>
    )
}

export default CreateQuizModal
