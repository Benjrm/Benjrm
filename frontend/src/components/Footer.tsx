// frontend/src/components/Footer.tsx

import type { JSX } from "react"
import { NavLink } from "react-router"
import { useTranslation } from "react-i18next"

const BRAND_NAME = "Benjrm"

export default function Footer(): JSX.Element {
    const { t } = useTranslation()

    return (
        <footer className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 mt-auto border-t backdrop-blur">
            <div className="mx-auto flex flex-col items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-6 md:flex-row">
                {/* Left side: Logo */}
                <div className="flex flex-1 justify-center md:justify-start">
                    <NavLink
                        end
                        className="shrink-0 text-xl font-extrabold tracking-tighter text-[#00F2FF] sm:text-2xl"
                        to="/"
                    >
                        {BRAND_NAME}
                    </NavLink>
                </div>

                {/* Center: Copyright text */}
                <div className="text-muted-foreground shrink-0 text-center text-sm font-medium">
                    &copy; {new Date().getFullYear()} {BRAND_NAME}.{" "}
                    {t("common.footer.allRightsReserved")}
                </div>

                {/* Right side: Links */}
                <nav className="flex flex-1 flex-wrap items-center justify-center gap-4 sm:gap-6 md:justify-end">
                    <NavLink
                        className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                        to="/imprint"
                    >
                        {t("common.footer.imprint")}
                    </NavLink>
                    <NavLink
                        className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                        to="/privacy"
                    >
                        {t("common.footer.privacyPolicy")}
                    </NavLink>
                    <NavLink
                        className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                        to="/terms"
                    >
                        {t("common.footer.termsAndConditions")}
                    </NavLink>
                </nav>
            </div>
        </footer>
    )
}
