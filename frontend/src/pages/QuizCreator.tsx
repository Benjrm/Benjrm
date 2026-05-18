// frontend/src/pages/QuizCreator.tsx

import type { JSX } from "react"
import { useState } from "react"
import { Settings, HelpCircle } from "lucide-react"
import QuestionSidebar from "../components/QuestionSidebar"
import SettingsPanel from "../components/SettingsPanel"
import { Input } from "@/shadcn/components/ui/input"
import { Button } from "@/shadcn/components/ui/button"

// --- Types ---

export interface Question {
    id: number
    title: string
    type: "Multiple Choice" | "True/False"
    options: string[]
}

// --- Internal Helper Componenents---

interface AnswerCardProps {
    color: string
    icon: string
    placeholder: string
    value: string
    onChange: (val: string) => void
}

function AnswerCard({ color, icon, placeholder, value, onChange }: AnswerCardProps): JSX.Element {
    return (
        <div
            className={`${color} group relative flex min-h-25 items-center rounded-lg p-1 shadow-lg transition-transform hover:scale-[1.01]`}
        >
            <div className="absolute top-4 left-4 h-6 w-6 rounded-full border-2 border-white/50" />
            <span className="absolute top-4 right-4 text-xl font-bold text-white/50">{icon}</span>
            <input
                className="w-full bg-transparent px-12 text-xl font-bold text-white placeholder:text-white/40 focus:outline-none"
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                type="text"
                value={value}
            />
        </div>
    )
}

// --- Main Component ---

export default function QuizCreatorPage(): JSX.Element {
    const [quizTitle, setQuizTitle] = useState<string>("Untitled")

    const [questions, setQuestions] = useState<Question[]>([
        { id: 1, title: "", type: "Multiple Choice", options: ["", "", "", ""] },
    ])

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)

    const currentQuestion = questions[currentQuestionIndex]

    /**
     * Updates the current question in the state array.
     * Uses Partial<Question> to allow updating only specific fields.
     */
    const updateQuestion = (data: Partial<Question>) => {
        setQuestions((prevQuestions) => {
            const updated = [...prevQuestions]
            updated[currentQuestionIndex] = {
                ...updated[currentQuestionIndex],
                ...data,
            }
            return updated
        })
    }

    /**
     * Updates a specific option string within the current question's options array.
     */
    const updateOption = (index: number, value: string) => {
        const newOptions = [...currentQuestion.options]
        newOptions[index] = value
        updateQuestion({ options: newOptions })
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#121926] text-white">
            {/* Top Navbar */}
            <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#1a2234] px-6">
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
                        New Quiz:
                    </span>
                    <Input
                        className="h-auto w-64 border-none bg-transparent p-0 text-xl font-bold focus-visible:ring-0"
                        onChange={(e) => setQuizTitle(e.target.value)}
                        value={quizTitle}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button className="gap-2" variant="ghost">
                        <Settings className="h-4 w-4" /> Settings
                    </Button>
                    <Button className="bg-[#00F2FF] font-bold text-black hover:bg-[#00d8e4]">
                        Save Quiz
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Questions List */}
                <QuestionSidebar
                    activeIndex={currentQuestionIndex}
                    onSelect={setCurrentQuestionIndex}
                    questions={questions}
                    onAdd={() =>
                        setQuestions((prev) => [
                            ...prev,
                            {
                                id: Date.now(),
                                title: "",
                                type: "Multiple Choice",
                                options: ["", "", "", ""],
                            },
                        ])
                    }
                />

                {/* Center: Editor Area */}
                <main className="scrollbar-hide flex flex-1 flex-col items-center gap-6 overflow-y-auto p-8">
                    {/* Question Input */}
                    <div className="w-full max-w-4xl rounded-xl border border-white/5 bg-[#1a2234] p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-400">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <select
                                className="cursor-pointer rounded-md border-none bg-[#252f44] p-2 text-sm outline-none"
                                value={currentQuestion.type}
                                onChange={(e) =>
                                    updateQuestion({ type: e.target.value as Question["type"] })
                                }
                            >
                                <option value="Multiple Choice">Multiple Choice</option>
                                <option value="True/False">True/False</option>
                            </select>
                        </div>
                        <textarea
                            className="h-24 w-full resize-none bg-transparent text-center text-2xl font-medium outline-none placeholder:text-gray-600"
                            onChange={(e) => updateQuestion({ title: e.target.value })}
                            placeholder="Type your question here..."
                            value={currentQuestion.title}
                        />
                    </div>

                    {/* Answer Options Grid */}
                    <div className="mt-4 grid w-full max-w-5xl grid-cols-1 gap-3 md:grid-cols-2">
                        <AnswerCard
                            color="bg-[#2d4cc9]"
                            icon="▲"
                            onChange={(val) => updateOption(0, val)}
                            placeholder="Option 1"
                            value={currentQuestion.options[0]}
                        />
                        <AnswerCard
                            color="bg-[#ffa602]"
                            icon="◆"
                            onChange={(val) => updateOption(1, val)}
                            placeholder="Option 2"
                            value={currentQuestion.options[1]}
                        />
                        <AnswerCard
                            color="bg-[#11c8d4]"
                            icon="●"
                            onChange={(val) => updateOption(2, val)}
                            placeholder="Option 3"
                            value={currentQuestion.options[2]}
                        />
                        <AnswerCard
                            color="bg-[#ff4949]"
                            icon="■"
                            onChange={(val) => updateOption(3, val)}
                            placeholder="Option 4"
                            value={currentQuestion.options[3]}
                        />
                    </div>
                </main>

                {/* Right: Settings & Preview */}
                <SettingsPanel question={currentQuestion} />
            </div>

            {/* Help Button */}
            <button
                className="absolute right-6 bottom-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#1a2234] text-gray-400 transition-colors hover:text-white"
                type="button"
            >
                <HelpCircle className="h-6 w-6" />
            </button>
        </div>
    )
}
