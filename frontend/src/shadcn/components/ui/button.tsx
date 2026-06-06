import type { ComponentProps, JSX } from "react"
import type { VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shadcn/lib/utils"
import { buttonVariants } from "@/shadcn/components/ui/buttonVariants"

function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
}: ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }): JSX.Element {
    const Comp = asChild ? Slot.Root : "button"

    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            data-size={size}
            data-slot="button"
            data-variant={variant}
            {...props}
        />
    )
}

export { Button }
export default Button
