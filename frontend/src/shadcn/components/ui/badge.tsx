import type { ComponentProps, JSX } from "react"
import type { VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shadcn/lib/utils"
import { badgeVariants } from "@/shadcn/components/ui/badgeVariants"

function Badge({
    className,
    variant = "default",
    asChild = false,
    ...props
}: ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }): JSX.Element {
    const Comp = asChild ? Slot.Root : "span"

    return (
        <Comp
            className={cn(badgeVariants({ variant }), className)}
            data-slot="badge"
            data-variant={variant}
            {...props}
        />
    )
}

export { Badge }
export default Badge
