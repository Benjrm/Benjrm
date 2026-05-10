// src/components/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "dark" | "light" | "auto"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "auto",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

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

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}