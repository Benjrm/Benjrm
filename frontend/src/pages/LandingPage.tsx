// src/pages/LandingPage.tsx
import { Input } from "@/shadcn/components/ui/input";
import { Button } from "@/shadcn/components/ui/button";

export default function LandingPage() {
    return (
        <div className="min-h-full bg-background text-foreground overflow-x-hidden">
            <main className="max-w-360 mx-auto px-4 sm:px-6 py-8 md:py-24 relative">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-24 items-center relative z-10">

                    {/* Left Column */}
                    <div className="flex flex-col gap-6 md:gap-10">

                        <div className="space-y-4 md:space-y-6">
                            {/* Orange pill */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF8A00]/10 border border-[#FF8A00]/20 text-[#FF8A00] text-xs font-bold tracking-widest uppercase w-max">
                                <span className="w-2 h-2 rounded-full bg-[#FF8A00] animate-pulse"></span>
                                New Features Live
                            </div>

                            {/* Smaller heading on mobile */}
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.95]">
                                Engage and learn <br />
                                with <span className="text-[#00F2FF]">Benjrm</span>
                            </h1>
                            <p className="text-base sm:text-xl text-muted-foreground tracking-wide font-medium">
                                HOST AND PLAY FUN AND INTERACTIVE QUIZZES
                            </p>
                        </div>

                        {/* Game PIN — stacks vertically on mobile, row on sm+ */}
                        <div className="bg-muted/50 p-4 sm:p-8 rounded-xl shadow-lg border border-border flex flex-col sm:flex-row gap-3 items-center backdrop-blur-sm">
                            <Input
                                type="text"
                                placeholder="ENTER GAME PIN"
                                className="w-full h-12 sm:h-14 text-center text-lg sm:text-xl font-bold tracking-widest bg-background border-border placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-[#00F2FF] focus-visible:border-transparent transition-all"
                            />
                            <Button
                                size="lg"
                                className="h-12 sm:h-14 w-full sm:w-auto px-8 sm:px-12 text-base sm:text-lg font-bold bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 cursor-pointer transition-colors"
                            >
                                PLAY
                            </Button>
                        </div>

                        {/* Create link */}
                        <div>
                            <a href="/create" className="group inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-[#FF8A00] transition-colors tracking-wider">
                                CREATE YOUR OWN QUIZ
                                <span className="transition-transform group-hover:translate-x-1">→</span>
                            </a>
                        </div>
                    </div>

                    {/* Right Column: hidden on small mobile, shown md+ */}
                    <div className="relative hidden md:block">
                        <div className="absolute -inset-1 bg-linear-to-tr from-[#00F2FF] to-[#FF8A00] rounded-[2.5rem] blur-2xl opacity-20"></div>

                        <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <img
                                src="/pictures/happy_people.jpg"
                                alt="Students participating in a quiz"
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/10 to-transparent flex items-end p-8 lg:p-12">
                                <p className="text-3xl lg:text-5xl font-extrabold tracking-tighter text-white leading-tight max-w-[85%]">
                                    Quiz together, learn forever.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}