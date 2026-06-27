// frontend/src/components/QuizForm.tsx

import { useState } from "react"
import type { FC, SubmitEvent } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { DialogFooter } from "@/shadcn/components/ui/dialog"
import { Button } from "@/shadcn/components/ui/button"
import { Label } from "@/shadcn/components/ui/label"
import { useCreateQuiz, useUpdateQuiz } from "@/api/quizzes/quizzes.queries.ts"

function getReadableQuizMutationError(t: TFunction): string {
    return t("quiz.form.saveError")
}

interface QuizFormProps {
    initialDescription: string
    initialTitle: string
    mode: "create" | "edit"
    onClose: () => void
    onSuccess: (quizId?: string) => void
    quizId?: string
}

const QuizForm: FC<QuizFormProps> = ({
    initialDescription,
    initialTitle,
    mode,
    onClose,
    onSuccess,
    quizId,
}) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)

    const createMutation = useCreateQuiz()
    const updateMutation = useUpdateQuiz(quizId)
    const isLoading = mode === "create" ? createMutation.isPending : updateMutation.isPending

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault()

        try {
            if (mode === "create") {
                const quiz = await createMutation.mutateAsync({
                    title,
                    description: description || null,
                    hidden: false,
                })

                setTitle("")
                setDescription("")
                onClose()
                navigate(`/quiz/${quiz.id}`)
                onSuccess(quiz.id)
            } else {
                if (!quizId) {
                    toast.error(t("quiz.form.missingIdError"))
                    return
                }

                const updated = await updateMutation.mutateAsync({
                    title,
                    description: description || null,
                    hidden: false,
                })

                onClose()
                onSuccess(updated.id)
            }
        } catch {
            toast.error(getReadableQuizMutationError(t))
        }
    }

    let buttonText = t("quiz.form.createButton")
    if (isLoading) {
        buttonText = mode === "create" ? t("quiz.form.creating") : t("quiz.form.saving")
    } else if (mode === "edit") {
        buttonText = t("quiz.form.saveChangesButton")
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <Label className="block text-sm font-medium" htmlFor="title">
                    {t("quiz.form.titleLabel")}
                </Label>
                <input
                    required
                    className="border-input bg-background mt-1 w-full rounded border px-3 py-2 text-sm"
                    id="title"
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("quiz.form.titlePlaceholder")}
                    type="text"
                    value={title}
                />
            </div>

            <div>
                <Label className="block text-sm font-medium" htmlFor="description">
                    {t("quiz.form.descriptionLabel")}
                </Label>
                <textarea
                    className="border-input bg-background mt-1 w-full rounded border px-3 py-2 text-sm"
                    id="description"
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("quiz.form.descriptionPlaceholder")}
                    rows={3}
                    value={description}
                />
            </div>

            <DialogFooter>
                <Button disabled={isLoading} onClick={onClose} type="button" variant="outline">
                    {t("common.buttons.cancel")}
                </Button>
                <Button disabled={isLoading} type="submit">
                    {buttonText}
                </Button>
            </DialogFooter>
        </form>
    )
}

export default QuizForm
