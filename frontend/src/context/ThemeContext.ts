// frontend/src/context/ThemeContext.ts

import { createContext, useContext } from "react"

export type Theme = "dark" | "light" | "auto"

export interface ThemeProviderState {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "auto",
    setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const useTheme = (): ThemeProviderState => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
