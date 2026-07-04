import type { ComponentProps, JSX } from "react"
import { Progress } from "radix-ui"

import { cn } from "@/shadcn/lib/utils"

interface ProgressBarProps extends ComponentProps<typeof Progress.Root> {
    indicatorClassName?: string
}

function ProgressBar({
    className,
    value,
    indicatorClassName,
    ...props
}: Readonly<ProgressBarProps>): JSX.Element {
    return (
        <Progress.Root
            value={value}
            className={cn(
                "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
                className
            )}
            {...props}
        >
            <Progress.Indicator
                style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
                className={cn(
                    "h-full w-full flex-1 rounded-full transition-all duration-500 ease-linear",
                    indicatorClassName
                )}
            />
        </Progress.Root>
    )
}

export default ProgressBar
