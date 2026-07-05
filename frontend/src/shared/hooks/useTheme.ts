import { useContext } from "react"
import ThemeProviderContext from "@/shared/context/ThemeContext.ts"
import type { ThemeProviderState } from "@/shared/types/themeProviderState.ts"

/**
 * Accesses the current {@link ThemeProviderState} provided by `ThemeProvider`.
 *
 * @throws {Error} If called outside of a `ThemeProvider`.
 */
const useTheme = (): ThemeProviderState => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
export default useTheme
