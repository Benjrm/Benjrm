import type { JSX } from "react"
import { Input } from "@/shadcn/components/ui/input"
import { Button } from "@/shadcn/components/ui/button"
import Navbar from "@/components/Navbar.tsx"

export default function LandingPage(): JSX.Element {
    return (
        <div className="bg-background text-foreground min-h-full overflow-x-hidden">
            <Navbar />
            <main className="relative mx-auto max-w-360 px-4 py-8 sm:px-6 md:py-24">
                <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-24">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6 md:gap-10">
                        <div className="space-y-4 md:space-y-6">
                            {/* Orange pill */}
                            <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#FF8A00]/20 bg-[#FF8A00]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FF8A00] uppercase">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF8A00]" />
                                New Features Live
                            </div>

                            {/* Smaller heading on mobile */}
                            <h1 className="flex flex-col gap-2 text-4xl font-extrabold tracking-tighter sm:gap-2 sm:text-5xl md:text-7xl">
                                <span>Engage and learn</span>
                                <span>
                                    with <span className="text-[#00F2FF]">Benjrm</span>
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-base font-medium tracking-wide sm:text-xl">
                                HOST AND PLAY FUN AND INTERACTIVE QUIZZES
                            </p>
                        </div>

                        {/* Game PIN — stacks vertically on mobile, row on sm+ */}
                        <div className="bg-muted/50 border-border flex flex-col items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:p-8">
                            <Input
                                aria-label="Enter Game PIN"
                                className="bg-background border-border placeholder:text-muted-foreground/70 h-12 w-full text-center text-lg font-bold tracking-widest transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#00F2FF] sm:h-14 sm:text-xl"
                                placeholder="ENTER GAME PIN"
                                type="text"
                            />
                            <Button
                                className="h-12 w-full cursor-pointer bg-black px-8 text-base font-bold text-white transition-colors hover:bg-gray-800 sm:h-14 sm:w-auto sm:px-12 sm:text-lg dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                size="lg"
                            >
                                PLAY
                            </Button>
                        </div>

                        {/* Create link */}
                        <div>
                            <a
                                className="group text-foreground inline-flex items-center gap-2 text-sm font-bold tracking-wider transition-colors hover:text-[#FF8A00]"
                                href="/create"
                            >
                                CREATE YOUR OWN QUIZ
                                <span className="transition-transform group-hover:translate-x-1">
                                    →
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Right Column: hidden on small mobile, shown md+ */}
                    <div className="relative hidden md:block">
                        <div className="absolute -inset-1 rounded-[2.5rem] bg-linear-to-tr from-[#00F2FF] to-[#FF8A00] opacity-20 blur-2xl" />

                        <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                            <img
                                alt="Students participating in a quiz"
                                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                src="/pictures/happy_people.jpg"
                            />
                            <div className="from-background/95 via-background/10 absolute inset-0 flex items-end bg-linear-to-t to-transparent p-8 lg:p-12">
                                <p className="max-w-[85%] text-3xl leading-tight font-extrabold tracking-tighter text-white lg:text-5xl">
                                    Quiz together, learn forever.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
