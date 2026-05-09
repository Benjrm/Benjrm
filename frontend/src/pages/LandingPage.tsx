// src/pages/LandingPage.tsx
import { Input } from "@/shadcn/components/ui/input";
import { Button } from "@/shadcn/components/ui/button";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            <main className="max-w-[90rem] mx-auto px-6 py-12 md:py-24 relative">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
                    {/* Left Column: Content and Game PIN */}
                    <div className="flex flex-col gap-10">
                        {/* Typography */}
                        <div className="space-y-6">
                            {/* MOODBOARD ACCENT: Orange decorative pill */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF8A00]/10 border border-[#FF8A00]/20 text-[#FF8A00] text-xs font-bold tracking-widest uppercase w-max">
                                <span className="w-2 h-2 rounded-full bg-[#FF8A00] animate-pulse"></span>
                                New Features Live
                            </div>

                            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter leading-[0.9]">
                                Engage and learn <br />
                                with <span className="text-[#00F2FF]">Benjrm</span>
                            </h1>
                            <p className="text-xl text-muted-foreground tracking-wide font-medium">
                                HOST AND PLAY FUN AND INTERACTIVE QUIZZES
                            </p>
                        </div>

                        {/* Game PIN Input Section */}
                        <div className="bg-muted/50 p-8 rounded-xl shadow-lg border border-border flex flex-col sm:flex-row gap-4 items-center max-w-xl backdrop-blur-sm">
                            <Input
                                type="text"
                                placeholder="ENTER GAME PIN"
                                // MOODBOARD ACCENT: Cyan focus ring when typing
                                className="w-full h-14 text-center text-xl font-bold tracking-widest bg-background border-border placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-[#00F2FF] focus-visible:border-transparent transition-all"
                            />
                            <Button size="lg" className="h-14 w-full sm:w-auto px-12 text-lg font-bold bg-white text-black hover:bg-gray-200 cursor-pointer transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                PLAY
                            </Button>
                        </div>

                        {/* Bottom Link */}
                        <div className="mt-12 lg:mt-24">
                            {/* MOODBOARD ACCENT: Orange hover effect with animated arrow */}
                            <a href="/create" className="group inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-[#FF8A00] transition-colors tracking-wider">
                                CREATE YOUR OWN QUIZ
                                <span className="transition-transform group-hover:translate-x-1">→</span>
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Image and Caption */}
                    <div className="relative">
                        {/* MOODBOARD ACCENT: Ambient Cyan/Orange Glow behind the image */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-[#00F2FF] to-[#FF8A00] rounded-[2.5rem] blur-2xl opacity-20"></div>

                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            {/* The Image: Removed mix-blend and added a premium hover zoom */}
                            <img
                                src="/pictures/happy_people.jpg"
                                alt="Students participating in a quiz"
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />

                            {/* Caption Overlay: Lightened the middle of the gradient so the faces stay bright */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent flex items-end p-8 lg:p-12">
                                <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white leading-tight max-w-[85%]">
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