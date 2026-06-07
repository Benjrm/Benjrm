import React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/shadcn/lib/utils"

function ScrollBar({
    className,
    orientation = "vertical",
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>): React.JSX.Element {
    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-orientation={orientation}
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                className="bg-border relative flex-1 rounded-full"
                data-slot="scroll-area-thumb"
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    )
}

function ScrollArea({
    className,
    children,
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>): React.JSX.Element {
    return (
        <ScrollAreaPrimitive.Root
            className={cn("relative", className)}
            data-slot="scroll-area"
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
                data-slot="scroll-area-viewport"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    )
}

export { ScrollArea, ScrollBar }
