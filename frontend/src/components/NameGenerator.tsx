import { Dices } from "lucide-react"
import type { JSX } from "react"
import { Button } from "@/shadcn/components/ui/button"
import { Input } from "@/shadcn/components/ui/input"

import useNameGenerator from "@/hooks/useNameGenerator"

export default function NameGenerator(): JSX.Element {
    const { name, setName, isGenerating, generateName } = useNameGenerator()

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <Input
                    className="h-11 border-cyan-300 bg-cyan-50 text-cyan-800 hover:shadow-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/30 dark:border-cyan-700 dark:text-cyan-300"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    type="text"
                    value={name}
                />
            </div>
            <Button
                className="h-11 w-11 border-cyan-500/30 bg-cyan-50 text-gray-500 hover:border-cyan-700 hover:bg-cyan-200 hover:text-cyan-700 hover:shadow-cyan-300/30 dark:border-cyan-800 dark:text-cyan-800 dark:hover:border-cyan-300/30 dark:hover:bg-cyan-700/30 dark:hover:text-cyan-300"
                disabled={isGenerating}
                onClick={generateName}
                size="icon"
                variant="outline"
            >
                <Dices className={`h-5 w-5 ${isGenerating ? "animate-spin" : ""}`} />
            </Button>
        </div>
    )
}
