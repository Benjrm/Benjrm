// frontend/src/components/SettingsPanel.tsx

import type { JSX } from "react"
import type { Question } from "../pages/QuizCreator"

interface SettingsPanelProps {
    question: Question
}

export default function SettingsPanel({ question }: SettingsPanelProps): JSX.Element {
    const colors = ["bg-[#2d4cc9]", "bg-[#ffa602]", "bg-[#11c8d4]", "bg-[#ff4949]"]
    const icons = ["▲", "◆", "●", "■"]

    return (
        <aside className="flex w-72 flex-col gap-8 border-l border-white/10 bg-[#1a2234] p-6">
            <div>
                <h2 className="mb-6 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Settings & Preview
                </h2>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label
                            className="mb-2 block text-[10px] font-bold text-gray-500 uppercase"
                            htmlFor="timeLimit"
                        >
                            <span>Question Time Limit</span>
                            <select
                                className="mt-2 w-full rounded-md border border-white/10 bg-[#121926] p-2 text-sm text-white"
                                id="timeLimit"
                            >
                                <option>10 seconds</option>
                                <option>20 seconds</option>
                                <option>30 seconds</option>
                            </select>
                        </label>
                    </div>
                    <div className="space-y-2">
                        <label
                            className="mb-2 block text-[10px] font-bold text-gray-500 uppercase"
                            htmlFor="points"
                        >
                            <span>Points</span>
                            <select
                                className="mt-2 w-full rounded-md border border-white/10 bg-[#121926] p-2 text-sm text-white"
                                id="points"
                            >
                                <option>1000</option>
                                <option>2000</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                    Answer Preview
                </span>
                <div className="flex aspect-9/12 flex-col rounded-2xl border border-white/5 bg-[#121926] p-4 shadow-inner">
                    <div className="mb-4 flex min-h-10 items-center justify-center rounded-lg bg-[#252f44] p-3 text-center text-[10px] font-bold">
                        {question.title || "Type your question..."}
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-2">
                        {question.options.map((option, index) => (
                            <div
                                key={`option-${icons[index]}`}
                                className={`${colors[index]} flex items-center justify-center rounded-md p-1 text-center text-[8px] font-medium transition-all duration-200`}
                            >
                                {option || icons[index]}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    )
}
