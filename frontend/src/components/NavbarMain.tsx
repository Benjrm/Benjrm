// frontend/src/components/NavbarMain.tsx

import type { JSX } from "react"
import { useState } from "react"
import { NavLink } from "react-router"
import { Menu, UserCircle2, X } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import NavItem from "./NavItem"
import LogoutButton from "@/auth/components/LogoutButton.tsx"

export default function NavbarMain(): JSX.Element {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
            <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
                {/* Left side */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <NavLink
                        className="shrink-0 text-2xl font-extrabold tracking-tighter text-[#00F2FF] sm:text-3xl"
                        to="/"
                    >
                        Benjrm
                    </NavLink>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-6 md:flex">
                        <NavItem to="/dashboard">Home</NavItem>
                    </nav>
                </div>
                {/* Right side (Theme, Profile, Mobile Menu Toggle) */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <ThemeToggle />

                    <div
                        aria-label="Profile placeholder"
                        className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 sm:h-9 sm:w-9"
                        role="img"
                    >
                        <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <LogoutButton />

                    {/* Hamburger Menu Toggle (Mobile) */}
                    <button
                        aria-label="Toggle menu"
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
                    {/* Mobile Links - Center */}
                    <nav className="flex flex-col items-center gap-5">
                        <NavItem
                            isMobile
                            onClick={() => setIsMobileMenuOpen(false)}
                            to="/dashboard"
                        >
                            Home
                        </NavItem>
                    </nav>
                </div>
            ) : null}
        </header>
    )
}
