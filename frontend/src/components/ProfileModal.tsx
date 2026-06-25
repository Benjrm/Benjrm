import { useState } from "react"
import type { FC } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/shadcn/components/ui/button"
import { Input } from "@/shadcn/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"
import { Separator } from "@/shadcn/components/ui/separator"
import useDeleteAccount from "@/api/user/useDeleteAccount"

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
    accountUrl: string | null
}

const CONFIRM_PHRASE = "DELETE"

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onClose, accountUrl }) => {
    const [confirmText, setConfirmText] = useState("")
    const [isDeleted, setIsDeleted] = useState(false)
    const { mutate: deleteAccount, isPending } = useDeleteAccount()

    const canDelete = confirmText === CONFIRM_PHRASE && !isPending

    const handleDelete = () => {
        if (!canDelete) return
        deleteAccount(undefined, {
            onSuccess: () => {
                setIsDeleted(true)
            },
        })
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setConfirmText("")
            setIsDeleted(false)
            onClose()
        }
    }

    if (isDeleted) {
        return (
            <Dialog onOpenChange={handleOpenChange} open={isOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Account Deleted</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm">
                            Your Benjrm account has been successfully deleted.
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Note: this only deleted your Benjrm account. Your account at your
                            identity provider was not affected.
                        </p>
                        {accountUrl !== null ? (
                            <>
                                <p className="text-muted-foreground text-sm">
                                    You may also want to delete your account at your identity
                                    provider. Click below to open it.
                                </p>
                                <Button
                                    className="w-full gap-2"
                                    variant="outline"
                                    onClick={() =>
                                        window.open(accountUrl, "_blank", "noopener,noreferrer")
                                    }
                                >
                                    Open Identity Provider
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                To delete your account at your identity provider, please contact
                                your administrator.
                            </p>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                window.location.href = "/"
                            }}
                        >
                            Go to Home
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog onOpenChange={handleOpenChange} open={isOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Profile</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    {accountUrl !== null ? (
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-sm font-medium">Account Settings</p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Edit your account settings in your identity provider.
                                </p>
                            </div>
                            <Button
                                className="w-full gap-2"
                                variant="outline"
                                onClick={() =>
                                    window.open(accountUrl, "_blank", "noopener,noreferrer")
                                }
                            >
                                Open Account Settings
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Your account settings are managed externally. Contact your administrator
                            for help with account management.
                        </p>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-sm font-medium text-red-500">Danger Zone</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Permanently deletes your Benjrm account and all associated data.
                                Your identity provider account will not be affected.
                            </p>
                        </div>

                        <div className="bg-destructive/5 border-destructive/20 rounded-md border p-3">
                            <p className="text-sm font-medium">Deletion includes:</p>
                            <ul className="text-muted-foreground mt-1.5 list-inside list-disc space-y-0.5 text-sm">
                                <li>All your quizzes and questions</li>
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
