import type { ComponentProps, JSX } from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/shadcn/lib/utils"

function Separator({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>): JSX.Element {
    return (
        <SeparatorPrimitive.Root
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "bg-border shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
                className
            )}
            {...props}
        />
    )
}

export { Separator }
export default Separator
