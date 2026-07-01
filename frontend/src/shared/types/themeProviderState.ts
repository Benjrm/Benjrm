import type { Theme } from "@/shared/types/theme.ts"

export interface ThemeProviderState {
    theme: Theme
    setTheme: (theme: Theme) => void
}
