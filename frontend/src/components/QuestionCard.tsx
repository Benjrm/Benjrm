import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Building2, Check, Edit2, GripVertical, Target, Trash2, Users, X, Zap } from "lucide-react"
import type { JSX } from "react"
import { useState } from "react"

interface QuestionCardProps {
    isEditing: boolean
    onDelete: (id: number) => void
    onEdit: (id: number) => void
    question: {
        description: string
        icon: "building" | "users" | "bomb" | "target"
        id: number
        number: number
        title: string
    }
}

const iconMap = {
    bomb: Zap,
    building: Building2,
    target: Target,
    users: Users,
}

export default function QuestionCard({
    isEditing,
    onDelete,
    onEdit,
    question,
}: QuestionCardProps): JSX.Element {
    const [editData, setEditData] = useState({
        description: question.description,
        title: question.title,
    })

    const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
        disabled: isEditing,
        id: question.id,
    })

    const style = {
        opacity: isDragging ? 0.6 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
    }

    const IconComponent = iconMap[question.icon]

    const iconColors = {
        bomb: "text-[#00F2FF]",
        building: "text-[#00F2FF]",
        target: "text-[#00F2FF]",
        users: "text-[#FF8A00]",
    }

    const handleToggleEdit = () => {
        onEdit(question.id)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-muted/30 border-border/50 rounded-xl border border-l-4 border-l-[#00F2FF] p-4 transition-all sm:p-6 ${
                isDragging ? "scale-[1.02] border-[#00F2FF] shadow-lg" : ""
            } ${isEditing ? "bg-muted/60 ring-1 ring-[#00F2FF]/30" : "hover:bg-muted/50"}`}
        >
            <div className="flex items-start gap-3 sm:gap-4">
                {!isEditing && (
                    <div
                        {...attributes}
                        {...listeners}
                        aria-label="Drag Handle"
                        className="text-muted-foreground/50 hover:text-foreground flex cursor-grab items-center self-stretch pr-1 transition-colors active:cursor-grabbing"
                    >
                        <GripVertical className="h-5 w-5" />
                    </div>
                )}

                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12">
                    <IconComponent
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColors[question.icon]}`}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                            QUESTION {String(question.number).padStart(2, "0")}
                        </span>
                    </div>

                    {isEditing ? (
                        <div className="animate-in fade-in slide-in-from-top-1 mt-2 space-y-3">
                            <input
                                className="bg-background border-border w-full rounded border px-3 py-1.5 font-bold focus:ring-1 focus:ring-[#00F2FF] focus:outline-none"
                                placeholder="Question Title"
                                type="text"
                                value={editData.title}
                                onChange={(e) =>
                                    setEditData({ ...editData, title: e.target.value })
                                }
                            />
                            <textarea
                                className="bg-background border-border w-full rounded border px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#00F2FF] focus:outline-none"
                                placeholder="Question Description"
                                rows={2}
                                value={editData.description}
                                onChange={(e) =>
                                    setEditData({ ...editData, description: e.target.value })
                                }
                            />

                            <div className="border-border/50 border-t pt-2">
                                <p className="text-muted-foreground mb-2 text-[10px] font-bold uppercase">
                                    Answer Options
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="border-border h-4 w-4 shrink-0 rounded-full border" />
                                            <input
                                                disabled
                                                className="text-muted-foreground w-full bg-transparent text-sm italic outline-none"
                                                placeholder={`Option ${i} placeholder...`}
                                                type="text"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="mb-1 truncate text-base font-bold tracking-tight sm:text-lg">
                                {question.title}
                            </h3>
                            <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
                                {question.description}
                            </p>
                        </>
                    )}
                </div>

                <div
                    className={`flex shrink-0 flex-col items-center gap-1 transition-opacity sm:flex-row sm:gap-2 ${isEditing ? "opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100"}`}
                >
                    {isEditing ? (
                        <>
                            <button
                                className="rounded-lg p-2 text-[#00F2FF] transition-colors hover:bg-[#00F2FF]/10"
                                onClick={handleToggleEdit}
                                title="Save changes"
                                type="button"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                            <button
                                className="hover:bg-background text-muted-foreground rounded-lg p-2 transition-colors"
                                onClick={handleToggleEdit}
                                title="Cancel"
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="hover:bg-background text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
                                onClick={handleToggleEdit}
                                title="Edit question"
                                type="button"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                className="hover:bg-background text-muted-foreground hover:text-destructive rounded-lg p-2 transition-colors"
                                onClick={() => onDelete(question.id)}
                                title="Delete question"
                                type="button"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
