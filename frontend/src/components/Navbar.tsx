// src/components/Navbar.tsx
import { Button } from "@/shadcn/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import { NavLink } from "react-router";

export default function Navbar() {
    return (
        <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="max-w-360 mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">

                <NavLink to="/" end className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-[#00F2FF] shrink-0">
                    Benjrm
                </NavLink>

                {/* Right side */}
                <nav className="flex items-center gap-2 sm:gap-6">

                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            `hidden sm:block text-sm transition-colors ${
                                isActive
                                    ? "text-[#00F2FF] font-bold"
                                    : "text-muted-foreground hover:text-foreground font-medium"
                            }`
                        }
                    >
                        ABOUT US
                    </NavLink>

                    {/* Replaced two buttons with a single Keycloak gateway button */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            className="text-sm font-medium bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 cursor-pointer transition-colors"
                            onClick={() => {
                                // TODO: Implement the actual Keycloak redirect here later
                                console.log("Redirecting to Keycloak...");
                            }}
                        >
                            SIGN IN
                        </Button>
                    </div>

                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
