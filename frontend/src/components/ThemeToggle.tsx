// src/components/ThemeToggle.tsx
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@shadcn/components/ui/button";
import { useTheme, type Theme } from "./ThemeProvider";

const themes: Theme[] = ["light", "dark", "auto"];

const icons = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
};

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const cycle = () => {
        setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
    };

    const Icon = icons[theme];

    return (
        <Button variant="ghost" size="icon" onClick={cycle} title={`Theme: ${theme}`}>
            <Icon className="h-5 w-5" />
        </Button>
    );
}