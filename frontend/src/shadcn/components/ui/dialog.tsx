import type { ComponentProps, JSX } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { XIcon } from "lucide-react"
import { cn } from "@/shadcn/lib/utils"
import { Button } from "@/shadcn/components/ui/button"

function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>): JSX.Element {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>): JSX.Element {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: ComponentProps<typeof DialogPrimitive.Portal>): JSX.Element {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>): JSX.Element {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>): JSX.Element {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs",
                className
            )}
            {...props}
        />
    )
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
}): JSX.Element {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl p-6 text-sm ring-1 duration-100 outline-none sm:max-w-md",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton ? (
                    <DialogPrimitive.Close asChild data-slot="dialog-close">
                        <Button className="absolute top-4 right-4" size="icon-sm" variant="ghost">
                            <XIcon />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogPrimitive.Close>
                ) : null}
            </DialogPrimitive.Content>
        </DialogPortal>
    )
}

function DialogHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
    return (
        <div
            className={cn("flex flex-col gap-2", className)}
            data-slot="dialog-header"
            {...props}
        />
    )
}

function DialogFooter({
    className,
    showCloseButton = false,
    children,
    ...props
}: ComponentProps<"div"> & {
    showCloseButton?: boolean
}): JSX.Element {
    return (
        <div
            className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            data-slot="dialog-footer"
            {...props}
        >
            {children}
            {showCloseButton ? (
                <DialogPrimitive.Close asChild>
                    <Button variant="outline">Close</Button>
                </DialogPrimitive.Close>
            ) : null}
        </div>
    )
}

function DialogTitle({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Title>): JSX.Element {
    return (
        <DialogPrimitive.Title
            className={cn("font-heading leading-none font-medium", className)}
            data-slot="dialog-title"
            {...props}
        />
    )
}

function DialogDescription({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Description>): JSX.Element {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn(
                "text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
                className
            )}
            {...props}
        />
    )
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
}
