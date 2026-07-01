// frontend/src/context/ThemeContext.ts

import { createContext } from "react"
import type { ThemeProviderState } from "@/shared/types/themeProviderState.ts"

const initialState: ThemeProviderState = {
    theme: "auto",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)
export default ThemeProviderContext
