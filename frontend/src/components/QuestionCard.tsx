// frontend/src/components/QuestionCard.tsx

import { Building2, Users, Zap, Target, Edit2, Trash2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuestionCardProps {
    question: {
        id: number;
        number: number;
        title: string;
        description: string;
        icon: "building" | "users" | "bomb" | "target";
    };
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

const iconMap = {
    building: Building2,
    users: Users,
    bomb: Zap,
    target: Target,
};

export default function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.6 : 1,
    };

    const IconComponent = iconMap[question.icon];
    const iconColors = {
        building: "text-[#00F2FF]",
        users: "text-[#FF8A00]",
        bomb: "text-[#00F2FF]",
        target: "text-[#00F2FF]",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-muted/30 border-l-4 border-l-[#00F2FF] p-4 sm:p-6 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 ${
                isDragging ? "shadow-lg scale-[1.02] border-[#00F2FF]" : ""
            }`}
        >
            <div className="flex items-start gap-3 sm:gap-4">

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center self-stretch cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors pr-1"
                >
                    <GripVertical className="h-5 w-5" />
                </div>

                {/* Question Icon */}
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted shrink-0">
                    <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColors[question.icon]}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                            QUESTION {String(question.number).padStart(2, "0")}
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight mb-1 truncate">
                        {question.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {question.description}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(question.id)}
                        className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Edit question"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(question.id)}
                        className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete question"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}