import type { TFunction } from "i18next"
import type { QuestionType } from "@/features/question/types/questions.ts"

/**
 * Derives a short, plain-text preview of a question's markdown body for use
 * in list/sidebar views: takes the first non-empty line and strips markdown
 * heading/emphasis/link syntax. Falls back to a translated "untitled"
 * placeholder (varying by question `type`) when the result would be empty.
 *
 * @param text - Full markdown question text.
 * @param type - Question type, used to pick the untitled placeholder.
 * @param t - Optional i18next translate function; without it, an
 * English-only fallback string is used (e.g. for contexts without i18n set up).
 */
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
        .replace(/\[(.*?)]\(.*?\)/g, "$1")
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
