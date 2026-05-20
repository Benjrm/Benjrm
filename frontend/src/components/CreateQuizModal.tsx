// frontend/src/components/CreateQuizModal.tsx

/* eslint-disable react/require-default-props */
import { useState } from "react"
import type { FC, FormEvent } from "react"
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
import { createQuiz } from "@/api/Quiz"

interface CreateQuizModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (quizId: string) => void
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
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Track the last seen props to reset state during render when they change
    const [prevProps, setPrevProps] = useState({ isOpen, initialTitle, initialDescription })

    if (
        isOpen !== prevProps.isOpen ||
        initialTitle !== prevProps.initialTitle ||
        initialDescription !== prevProps.initialDescription
    ) {
        setPrevProps({ isOpen, initialTitle, initialDescription })
        setTitle(isOpen ? initialTitle : "")
        setDescription(isOpen ? initialDescription : "")
        setError(null)
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault()
        setError(null)

        try {
            setLoading(true)

            if (mode === "create") {
                const quiz = await createQuiz({
                    title,
                    description: description || undefined,
                    hidden: false,
                })

                setTitle("")
                setDescription("")
                onClose()
                onSuccess(quiz.id)
            } else {
                if (!quizId) throw new Error("Missing quiz id for edit")

                // lazy import to avoid circular deps
                const { updateQuiz } = await import("@/api/Quiz")

                const updated = await updateQuiz(quizId, {
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
        } finally {
            setLoading(false)
        }
    }

    // Fix no-nested-ternary error by resolving label here
    let buttonText = "Create Quiz"
    if (loading) {
        buttonText = mode === "create" ? "Creating..." : "Saving..."
    } else if (mode === "edit") {
        buttonText = "Save changes"
    }

    return (
        <Dialog onOpenChange={onClose} open={isOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new Quiz</DialogTitle>
                    <DialogDescription>Enter a title and optional description.</DialogDescription>
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
                            disabled={loading}
                            onClick={onClose}
                            type="button"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button disabled={loading} type="submit">
                            {buttonText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateQuizModal
