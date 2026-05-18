// frontend/src/components/CategoryHeader.tsx

import { ChevronRight } from "lucide-react"
import { Link } from "react-router"
import type { JSX } from "react"

interface Props {
    title: string
    description: string
    to: string
}

export default function CategoryHeader({ title, description, to }: Props): JSX.Element {
    return (
        <div className="flex items-end justify-between">
            <div>
                <h2 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl">
                    {title}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
            </div>
            <Link
                className="group text-muted-foreground ml-4 flex items-center gap-1 text-xs font-bold tracking-widest whitespace-nowrap uppercase transition-colors hover:text-[#00F2FF]"
                to={to}
            >
                View All
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
        </div>
    )
}
