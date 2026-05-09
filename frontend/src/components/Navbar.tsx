// src/components/Navbar.tsx
import { Button } from "@/shadcn/components/ui/button";

export default function Navbar() {
    return (
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-[90rem] mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="text-3xl font-extrabold tracking-tighter text-cyan-accent text-[#00F2FF]">
                    Benjrm
                </a>

                {/* Navigation */}
                <nav className="flex items-center gap-6">
                    <a href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        ABOUT US
                    </a>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="text-sm font-medium border-muted/50 hover:bg-accent hover:text-foreground">
                            LOGIN
                        </Button>
                        <Button className="text-sm font-medium bg-white text-black hover:bg-gray-200 cursor-pointer">
                            SIGN UP
                        </Button>
                    </div>
                </nav>
            </div>
        </header>
    );
}