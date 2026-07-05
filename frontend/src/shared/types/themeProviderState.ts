import type { Theme } from "@/shared/types/theme.ts"

/** Shape of the value exposed by `ThemeContext`. */
export interface ThemeProviderState {
    /** Currently active theme. */
    theme: Theme
    /** Updates the theme and persists the choice. */
    setTheme: (theme: Theme) => void
}
