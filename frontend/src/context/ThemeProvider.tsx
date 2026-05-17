// frontend/src/context/ThemeProvider.tsx

import type { JSX } from "react"
import { useEffect, useState, useMemo } from "react"
import { ThemeProviderContext } from "./ThemeContext"
import type { Theme } from "./ThemeContext"

interface ThemeProviderProps {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export default function ThemeProvider({
    children,
    defaultTheme = "auto",
    storageKey = "theme",
    ...props
}: ThemeProviderProps): JSX.Element {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(storageKey) as Theme
        return ["light", "dark", "auto"].includes(saved) ? saved : defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement
        const media = window.matchMedia("(prefers-color-scheme: dark)")

        const applyTheme = () => {
            root.classList.remove("light", "dark")
            if (theme === "auto") {
                root.classList.add(media.matches ? "dark" : "light")
            } else {
                root.classList.add(theme)
            }
        }

        applyTheme()
        media.addEventListener("change", applyTheme)
        return () => media.removeEventListener("change", applyTheme)
    }, [theme])

    const value = useMemo(
        () => ({
            theme,
            setTheme: (newTheme: Theme) => {
                localStorage.setItem(storageKey, newTheme)
                setTheme(newTheme)
            },
        }),
        [theme, storageKey]
    )

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

ThemeProvider.defaultProps = {
    defaultTheme: "auto",
    storageKey: "theme",
}
