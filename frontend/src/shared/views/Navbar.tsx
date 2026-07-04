import type { JSX } from "react"
import { useState } from "react"
import { NavLink } from "react-router"
import { Menu, UserCircle2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import ThemeToggle from "@/shared/views/ThemeToggle"
import MuteButton from "@/shared/views/MuteButton"
import NavItem from "@/shared/views/NavItem"
import AuthAction from "@/auth/views/AuthAction"
import useAuthUser from "@/auth/hooks/useAuthUser"
import ProfileModal from "@/features/user/views/ProfileModal"
import LanguageSwitcher from "@/shared/views/LanguageSwitcher"

export default function Navbar(): JSX.Element {
    const { t } = useTranslation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const { data: user } = useAuthUser()

    return (
        <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
            <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
                {/* Left side */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <NavLink
                        end
                        className="shrink-0 text-2xl font-extrabold tracking-tighter text-[#00F2FF] sm:text-3xl"
                        to="/"
                    >
                        {t("common.brandName")}
                    </NavLink>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-6 md:flex">
                        <NavItem to="/">{t("common.header.home")}</NavItem>
                        {user ? (
                            <NavItem to="/dashboard">{t("common.header.dashboard")}</NavItem>
                        ) : null}
                    </nav>
                </div>

                {/* Right side */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <MuteButton />

                    {user ? (
                        <>
                            <button
                                aria-label={t("common.header.openProfile")}
                                className="bg-muted text-muted-foreground hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 transition-colors sm:h-9 sm:w-9"
                                onClick={() => setIsProfileOpen(true)}
                                type="button"
                            >
                                <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                            <ProfileModal
                                accountUrl={user.accountUrl}
                                isOpen={isProfileOpen}
                                onClose={() => setIsProfileOpen(false)}
                            />
                        </>
                    ) : null}

                    <AuthAction />

                    {/* Hamburger toggle (mobile only) */}
                    <button
                        aria-label={t("common.header.toggleMenu")}
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        type="button"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen ? (
                <div className="border-border bg-background space-y-6 border-t px-4 py-6 shadow-lg md:hidden">
                    <nav className="flex flex-col items-center gap-5">
                        <NavItem isMobile onClick={() => setIsMobileMenuOpen(false)} to="/">
                            {t("common.header.home")}
                        </NavItem>
                        {user ? (
                            <NavItem
                                isMobile
                                onClick={() => setIsMobileMenuOpen(false)}
                                to="/dashboard"
                            >
                                {t("common.header.dashboard")}
                            </NavItem>
                        ) : null}
                    </nav>
                </div>
            ) : null}
        </header>
    )
}
