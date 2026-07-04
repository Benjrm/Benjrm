import type { TFunction } from "i18next"
import type { QuestionType } from "@/features/question/types/questions.ts"

export default function getQuestionPreviewText(
    text: string | undefined,
    type?: QuestionType,
    t?: TFunction
): string {
    const firstLine =
        text
            ?.split("\n")
            .map((l) => l.trim())
            .find((l) => l.length > 0) ?? ""
    const cleaned = firstLine
        .replace(/^#+\s*/, "")
        .replace(/[*_~`]/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .trim()

    if (t) {
        return (
            cleaned ||
            (type === "SLIDE"
                ? t("quizEditor.editor.untitledSlide")
                : t("quizEditor.editor.untitledQuestion"))
        )
    }
    return cleaned || (type === "SLIDE" ? "Untitled slide" : "Untitled question")
}
