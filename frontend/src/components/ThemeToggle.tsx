// src/components/ThemeToggle.tsx
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@shadcn/components/ui/button";
import { useTheme, type Theme } from "../hooks/useTheme";

const icons: Record<Theme, React.ElementType> = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
};

export default function ThemeToggle() {
    const { theme, cycleTheme } = useTheme();

    const Icon = icons[theme];

    return (
        <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Theme: ${theme}`}>
            <Icon className="h-5 w-5" />
        </Button>
    );
}