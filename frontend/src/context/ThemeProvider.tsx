// frontend/src/context/ThemeProvider.ts

import  { useEffect, useState } from "react"
import { ThemeProviderContext, type Theme } from "./ThemeContext"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export function ThemeProvider({
                                  children,
                                  defaultTheme = "auto",
                                  storageKey = "theme",
                                  ...props
                              }: ThemeProviderProps) {
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

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme)
            setTheme(newTheme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
