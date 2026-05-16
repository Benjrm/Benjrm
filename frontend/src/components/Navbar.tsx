// src/components/Navbar.tsx
import { NavLink } from "react-router"
import type { JSX } from "react"
import ThemeToggle from "./ThemeToggle"
import { Button } from "@/shadcn/components/ui/button"

export default function Navbar(): JSX.Element {
    return (
        <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 border-b backdrop-blur">
            <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
                <NavLink
                    end
                    className="shrink-0 text-2xl font-extrabold tracking-tighter text-[#00F2FF] sm:text-3xl"
                    to="/"
                >
                    Benjrm
                </NavLink>

                {/* Right side */}
                <nav className="flex items-center gap-2 sm:gap-6">
                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            `hidden text-sm transition-colors sm:block ${
                                isActive
                                    ? "font-bold text-[#00F2FF]"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`
                        }
                    >
                        ABOUT US
                    </NavLink>

                    {/* Replaced two buttons with a single Keycloak gateway button */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            className="cursor-pointer bg-black text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                            onClick={() => {
                                // TODO: Implement the actual Keycloak redirect here later
                            }}
                        >
                            SIGN IN
                        </Button>
                    </div>

                    <ThemeToggle />
                </nav>
            </div>
        </header>
    )
}
