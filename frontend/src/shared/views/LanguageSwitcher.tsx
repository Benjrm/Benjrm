import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
// eslint-disable-next-line import-x/no-unresolved -- Resolved by the Vite locales plugin.
import { manifest } from "virtual:locale"
import { t } from "i18next"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu"

export default function LanguageSwitcher(): ReactElement {
    const { i18n } = useTranslation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors"
                    title={t("common.language.switchLanguage")}
                    type="button"
                >
                    <span aria-hidden="true">{t("common.language.flag")}</span>
                    <span className="sr-only">{t("common.language.selectLanguage")}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.entries(manifest).map(([code, data]) => (
                    <DropdownMenuItem
                        key={code}
                        className="cursor-pointer"
                        onClick={async () => i18n.changeLanguage(code)}
                    >
                        <span className="mr-2 text-lg">{data.flag}</span> {data.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
