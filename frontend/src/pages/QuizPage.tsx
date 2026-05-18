import type { JSX } from "react"
import { useState } from "react"
import { useParams } from "react-router"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import QuestionCard from "../components/QuestionCard"

interface Question {
    description: string
    icon: "building" | "users" | "bomb" | "target"
    id: number
    number: number
    title: string
}

const initialQuestions: Question[] = [
    {
        description: "Placeholder description to make the compiler happy.",
        icon: "building",
        id: 1,
        number: 1,
        title: "Initial Setup",
    },
    {
        description: "How do you handle role-based access control?",
        icon: "users",
        id: 2,
        number: 2,
        title: "User Management",
    },
    {
        description: "What are the steps for zero-downtime deployment?",
        icon: "bomb",
        id: 3,
        number: 3,
        title: "Deployment Strategy",
    },
]

export default function QuizPage(): JSX.Element {
    const { quizId } = useParams()
    const [questions, setQuestions] = useState<Question[]>(initialQuestions)
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleAddQuestion = (): void => {
        const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1
        const newQuestion: Question = {
            description: "",
            icon: "building",
            id: newId,
            number: questions.length + 1,
            title: "New Question",
        }
        setQuestions([...questions, newQuestion])
    }

    const handleDeleteQuestion = (id: number): void => {
        setPendingDeleteId(id)
    }

    const confirmDelete = (): void => {
        if (pendingDeleteId === null) return
        const filtered = questions.filter((q) => q.id !== pendingDeleteId)
        setQuestions(filtered.map((q, i) => ({ ...q, number: i + 1 })))
        setPendingDeleteId(null)
    }

    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setQuestions((items: Question[]): Question[] => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                const newOrder = arrayMove(items, oldIndex, newIndex)
                return newOrder.map((q, index) => ({ ...q, number: index + 1 }))
            })
        }
    }

    return (
        <div className="mx-auto max-w-3xl py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Editing Quiz {quizId}</h1>
            </div>

            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                sensors={sensors}
            >
                <div className="flex flex-col gap-4">
                    <SortableContext
                        items={questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {questions.map((question) => (
                            <QuestionCard
                                key={question.id}
                                isEditing={editingId === question.id}
                                onDelete={handleDeleteQuestion}
                                onEdit={(id) => setEditingId(editingId === id ? null : id)}
                                question={question}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>

            <button
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-gray-500 transition-colors hover:border-blue-500 hover:text-blue-500"
                onClick={handleAddQuestion}
                type="button"
            >
                <span className="text-xl">+</span> Add New Question
            </button>

            {pendingDeleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-semibold">Delete question?</h2>
                        <p className="mb-4 text-sm text-gray-500">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                className="rounded-lg border px-4 py-2 text-gray-600 hover:bg-gray-50"
                                onClick={() => setPendingDeleteId(null)}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                                onClick={confirmDelete}
                                type="button"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
