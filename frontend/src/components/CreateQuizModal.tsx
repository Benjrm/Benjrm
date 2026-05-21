// frontend/src/components/CreateQuizModal.tsx

/* eslint-disable react/require-default-props */
import { useState } from "react"
import type { FC, FormEvent } from "react"
import { useNavigate } from "react-router"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/components/ui/dialog"
import { Button } from "@/shadcn/components/ui/button"
import { Label } from "@/shadcn/components/ui/label"
import { useCreateQuiz, useUpdateQuiz } from "@/api/Queries"

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
    const navigate = useNavigate()
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [error, setError] = useState<string | null>(null)

    const createMutation = useCreateQuiz()
    const updateMutation = useUpdateQuiz(quizId)
    const isLoading = mode === "create" ? createMutation.isPending : updateMutation.isPending

    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault()
        setError(null)

        try {
            if (mode === "create") {
                const quiz = await createMutation.mutateAsync({
                    title,
                    description: description || undefined,
                    hidden: false,
                })

                setTitle("")
                setDescription("")
                onClose()
                // Navigate to the new quiz editor
                navigate(`/quiz/${quiz.id}`)
                onSuccess(quiz.id)
            } else {
                if (!quizId) {
                    setError("Missing quiz id for edit")
                    return
                }

                const updated = await updateMutation.mutateAsync({
                    title,
                    description: description || undefined,
                    hidden: false,
                })

                onClose()
                onSuccess(updated.id)
            }
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Quiz konnte nicht erstellt werden."
            )
        }
    }

    // Fix no-nested-ternary error by resolving label here
    let buttonText = "Create Quiz"
    if (isLoading) {
        buttonText = mode === "create" ? "Creating..." : "Saving..."
    } else if (mode === "edit") {
        buttonText = "Save changes"
    }

    const dialogTitle = mode === "edit" ? "Edit quiz" : "Create a new Quiz"
    const dialogDescription =
        mode === "edit"
            ? "Update title and description."
            : "Enter a title and optional description."

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (open) {
                    setTitle(initialTitle)
                    setDescription(initialDescription)
                    setError(null)
                    return
                }

                onClose()
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <Label className="block text-sm font-medium" htmlFor="title">
                            Title *
                        </Label>
                        <input
                            required
                            className="border-input bg-background mt-1 w-full rounded border px-3 py-2 text-sm"
                            id="title"
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Math Quiz"
                            type="text"
                            value={title}
                        />
                    </div>

                    <div>
                        <Label className="block text-sm font-medium" htmlFor="description">
                            Description
                        </Label>
                        <textarea
                            className="border-input bg-background mt-1 w-full rounded border px-3 py-2 text-sm"
                            id="description"
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description for your quiz..."
                            rows={3}
                            value={description}
                        />
                    </div>

                    {error ? <p className="text-sm text-red-500">{error}</p> : null}

                    <DialogFooter>
                        <Button
                            disabled={isLoading}
                            onClick={onClose}
                            type="button"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button disabled={isLoading} type="submit">
                            {buttonText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateQuizModal
