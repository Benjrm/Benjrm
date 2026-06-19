import { useState } from "react"
import type { FC } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/shadcn/components/ui/button"
import { Input } from "@/shadcn/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"
import { Separator } from "@/shadcn/components/ui/separator"
import useDeleteAccount from "@/api/user/useDeleteAccount"
import useUserDataSummary from "@/api/user/useUserDataSummary"

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
    keycloakAccountUrl: string
}

const CONFIRM_PHRASE = "DELETE"

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onClose, keycloakAccountUrl }) => {
    const [confirmText, setConfirmText] = useState("")
    const { mutate: deleteAccount, isPending } = useDeleteAccount()
    const { data: summary } = useUserDataSummary(isOpen)

    const canDelete = confirmText === CONFIRM_PHRASE && !isPending

    const handleDelete = () => {
        if (!canDelete) return
        deleteAccount(undefined, {
            onSuccess: () => {
                window.location.href = "/"
            },
        })
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setConfirmText("")
            onClose()
        }
    }

    const quizLabel = summary
        ? `${summary.quizCount} ${summary.quizCount === 1 ? "quiz" : "quizzes"}`
        : "Quizzes"
    const questionLabel = summary
        ? `${summary.questionCount} ${summary.questionCount === 1 ? "question" : "questions"}`
        : "Questions"

    return (
        <Dialog onOpenChange={handleOpenChange} open={isOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Profile</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-sm font-medium">Account Settings</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Edit your username, email, and password in Keycloak.
                            </p>
                        </div>
                        <Button
                            className="w-full gap-2"
                            variant="outline"
                            onClick={() =>
                                window.open(keycloakAccountUrl, "_blank", "noopener,noreferrer")
                            }
                        >
                            Open Account Settings
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-sm font-medium text-red-500">Danger Zone</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Permanently deletes your account and all associated data.
                            </p>
                        </div>

                        <div className="bg-destructive/5 border-destructive/20 rounded-md border p-3">
                            <p className="text-sm font-medium">Deletion includes:</p>
                            <ul className="text-muted-foreground mt-1.5 list-inside list-disc space-y-0.5 text-sm">
                                <li>{quizLabel}</li>
                                <li>{questionLabel}</li>
                                <li>Account history</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-muted-foreground text-sm"
                                htmlFor="confirm-delete"
                            >
                                Type{" "}
                                <span className="text-foreground font-mono font-medium">
                                    DELETE
                                </span>{" "}
                                to confirm
                            </label>
                            <Input
                                disabled={isPending}
                                id="confirm-delete"
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE"
                                value={confirmText}
                            />
                        </div>

                        <Button disabled={!canDelete} onClick={handleDelete} variant="destructive">
                            {isPending ? "Deleting…" : "Delete Account"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileModal
