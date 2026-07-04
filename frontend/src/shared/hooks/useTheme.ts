import { useContext } from "react"
import ThemeProviderContext from "@/shared/context/ThemeContext.ts"
import type { ThemeProviderState } from "@/shared/types/themeProviderState.ts"

const useTheme = (): ThemeProviderState => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
export default useTheme
