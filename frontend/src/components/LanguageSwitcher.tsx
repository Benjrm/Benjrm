import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu"

export default function LanguageSwitcher(): ReactElement {
    const { i18n } = useTranslation()

    // Determine the active language prefix (defaults to 'en' if not set)
    const activeLang = i18n.resolvedLanguage ?? i18n.language ?? "en"
    const activeFlag = activeLang.startsWith("de") ? "🇩🇪" : "🇬🇧"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors"
                    title={activeLang.startsWith("de") ? "Sprache wechseln" : "Switch language"}
                    type="button"
                >
                    <span aria-hidden="true">{activeFlag}</span>
                    <span className="sr-only">Toggle language</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => i18n.changeLanguage("en")}
                >
                    <span className="mr-2 text-lg">🇬🇧</span> English
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => i18n.changeLanguage("de")}
                >
                    <span className="mr-2 text-lg">🇩🇪</span> Deutsch
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
