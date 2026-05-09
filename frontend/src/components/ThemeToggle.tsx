import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@//shadcn/components/ui/button";

type Theme = "light" | "dark" | "auto";

const themes: Theme[] = ["light", "dark", "auto"];

const icons = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
};

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem("theme") as Theme) ?? "auto"
    );

    useEffect(() => {
        const root = document.documentElement;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        root.classList.remove("light", "dark");

        if (theme === "auto") {
            root.classList.add(prefersDark ? "dark" : "light");
        } else {
            root.classList.add(theme);
        }

        localStorage.setItem("theme", theme);
    }, [theme]);

    const cycle = () => {
        setTheme((t) => themes[(themes.indexOf(t) + 1) % themes.length]);
    };

    const Icon = icons[theme];

    return (
        <Button variant="ghost" size="icon" onClick={cycle} title={`Theme: ${theme}`}>
            <Icon className="h-5 w-5" />
        </Button>
    );
}