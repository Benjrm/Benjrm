// src/hooks/useTheme.ts
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";
const themes: Theme[] = ["light", "dark", "auto"];

const isValidTheme = (value: string | null): value is Theme => {
    return value === "light" || value === "dark" || value === "auto";
};

export function useTheme() {
    const getInitialTheme = (): Theme => {
        if (typeof window === "undefined") return "auto";

        const value = localStorage.getItem(STORAGE_KEY);
        return isValidTheme(value) ? value : "auto";
    };

    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = () => {
            root.classList.remove("light", "dark");

            const active = theme === "auto"
                ? (media.matches ? "dark" : "light")
                : theme;

            root.classList.add(active);
        };

        applyTheme();
        localStorage.setItem(STORAGE_KEY, theme);

        media.addEventListener("change", applyTheme);
        return () => media.removeEventListener("change", applyTheme);
    }, [theme]);

    const cycleTheme = () => {
        setTheme((t) => themes[(themes.indexOf(t) + 1) % themes.length]);
    };

    return { theme, setTheme, cycleTheme };
}