import { useState } from "react"
import type { FC } from "react"
import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shadcn/components/ui/button"
import { Input } from "@/shadcn/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shadcn/components/ui/dialog"
import { Separator } from "@/shadcn/components/ui/separator"
import useDeleteAccount from "@/features/user/hooks/useDeleteAccount"

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
    accountUrl: string | null
}

const CONFIRM_PHRASE = "DELETE"

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onClose, accountUrl }) => {
    const { t } = useTranslation()
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
                        <DialogTitle>{t("common.profileModal.deleted.title")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm">{t("common.profileModal.deleted.success")}</p>
                        <p className="text-muted-foreground text-sm">
                            {t("common.profileModal.deleted.note")}
                        </p>
                        {accountUrl !== null ? (
                            <>
                                <p className="text-muted-foreground text-sm">
                                    {t("common.profileModal.deleted.openIdpHint")}
                                </p>
                                <Button
                                    className="w-full gap-2"
                                    variant="outline"
                                    onClick={() =>
                                        window.open(accountUrl, "_blank", "noopener,noreferrer")
                                    }
                                >
                                    {t("common.profileModal.deleted.openIdpButton")}
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                {t("common.profileModal.deleted.contactAdmin")}
                            </p>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                window.location.href = "/"
                            }}
                        >
                            {t("common.profileModal.deleted.goHome")}
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
                    <DialogTitle>{t("common.profileModal.title")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    {accountUrl !== null ? (
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-sm font-medium">
                                    {t("common.profileModal.settings.title")}
                                </p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {t("common.profileModal.settings.description")}
                                </p>
                            </div>
                            <Button
                                className="w-full gap-2"
                                variant="outline"
                                onClick={() =>
                                    window.open(accountUrl, "_blank", "noopener,noreferrer")
                                }
                            >
                                {t("common.profileModal.settings.openButton")}
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            {t("common.profileModal.settings.managedExternally")}
                        </p>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-sm font-medium text-red-500">
                                {t("common.profileModal.dangerZone.title")}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {t("common.profileModal.dangerZone.description")}
                            </p>
                        </div>

                        <div className="bg-destructive/5 border-destructive/20 rounded-md border p-3">
                            <p className="text-sm font-medium">
                                {t("common.profileModal.dangerZone.deletionIncludes")}
                            </p>
                            <ul className="text-muted-foreground mt-1.5 list-inside list-disc space-y-0.5 text-sm">
                                <li>{t("common.profileModal.dangerZone.itemQuizzes")}</li>
                                <li>{t("common.profileModal.dangerZone.itemHistory")}</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-muted-foreground text-sm"
                                htmlFor="confirm-delete"
                            >
                                {t("common.profileModal.dangerZone.confirmBefore")}{" "}
                                <span className="text-foreground font-mono font-medium">
                                    {CONFIRM_PHRASE}
                                </span>{" "}
                                {t("common.profileModal.dangerZone.confirmAfter")}
                            </label>
                            <Input
                                disabled={isPending}
                                id="confirm-delete"
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={CONFIRM_PHRASE}
                                value={confirmText}
                            />
                        </div>

                        <Button disabled={!canDelete} onClick={handleDelete} variant="destructive">
                            {isPending
                                ? t("common.profileModal.dangerZone.deleting")
                                : t("common.profileModal.dangerZone.deleteButton")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileModal
