// frontend/src/components/Navbar.tsx

import type { JSX } from "react"
import { NavLink } from "react-router"
import { Button } from "@/shadcn/components/ui/button"
import ThemeToggle from "@/components/ThemeToggle.tsx"

export default function Navbar(): JSX.Element {
    return (
        <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
            <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
                {/* Left: Logo */}
                <NavLink
                    end
                    className="shrink-0 text-2xl font-extrabold tracking-tighter text-[#00F2FF] sm:text-3xl"
                    to="/"
                >
                    Benjrm
                </NavLink>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        className="cursor-pointer bg-black text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        onClick={() => {
                            // TODO: Implement the actual Keycloak redirect here later
                        }}
                    >
                        SIGN IN
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
