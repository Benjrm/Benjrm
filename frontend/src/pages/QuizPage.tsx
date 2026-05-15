// frontend/src/pages/QuizPage.tsx

import { useState } from "react";
import { useParams } from "react-router";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import QuestionCard from "../components/QuestionCard";

const initialQuestions = [
    {
        id: 1,
        number: 1,
        title: "Initial Setup",
        description: "Placeholder description to make the compiler happy.",
        icon: "building" as const,
    },
    {
        id: 2,
        number: 2,
        title: "User Management",
        description: "How do you handle role-based access control?",
        icon: "users" as const,
    },
    {
        id: 3,
        number: 3,
        title: "Deployment Strategy",
        description: "What are the steps for zero-downtime deployment?",
        icon: "bomb" as const,
    },
];

export default function QuizPage() {
    const { quizId } = useParams();
    const [questions, setQuestions] = useState(initialQuestions);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newOrder = arrayMove(items, oldIndex, newIndex);

                return newOrder.map((q, index) => ({ ...q, number: index + 1 }));
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Editing Quiz {quizId}</h1>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col gap-4">
                    <SortableContext
                        items={questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {questions.map((question) => (
                            <QuestionCard
                                key={question.id}
                                question={question}
                                onEdit={(id) => console.log("Editing question:", id)}
                                onDelete={(id) => console.log("Deleting question:", id)}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    );
}