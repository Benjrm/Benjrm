import { createContext } from "react"
import type { ThemeProviderState } from "@/shared/types/themeProviderState.ts"

const initialState: ThemeProviderState = {
    theme: "auto",
    setTheme: () => null,
}

/** React context holding the current `Theme` and its setter. Populated by `ThemeProvider`. */
const ThemeProviderContext = createContext<ThemeProviderState>(initialState)
export default ThemeProviderContext
