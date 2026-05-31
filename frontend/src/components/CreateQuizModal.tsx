// frontend/src/components/CreateQuizModal.tsx

import type { FC } from "react"
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
    const dialogTitle = mode === "edit" ? "Edit quiz" : "Create a new Quiz"
    const dialogDescription =
        mode === "edit"
            ? "Update title and description."
            : "Enter a title and optional description."

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
