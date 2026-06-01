import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}

export { cn }
export default cn
