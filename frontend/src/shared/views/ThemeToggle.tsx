// frontend/src/components/ThemeToggle.tsx

import { Sun, Moon, Monitor } from "lucide-react"
import type { JSX } from "react"
import { Button } from "@shadcn/components/ui/button"
import { useTheme } from "@/shared/context/ThemeContext"
import type { Theme } from "@/shared/context/ThemeContext"

const themes: Theme[] = ["light", "dark", "auto"]

const icons = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
}

export default function ThemeToggle(): JSX.Element {
    const { theme, setTheme } = useTheme()

    const cycle = (): void => {
        setTheme(themes[(themes.indexOf(theme) + 1) % themes.length])
    }

    const Icon = icons[theme]

    return (
        <Button onClick={cycle} size="icon" title={`Theme: ${theme}`} variant="ghost">
            <Icon className="h-5 w-5" />
        </Button>
    )
}
