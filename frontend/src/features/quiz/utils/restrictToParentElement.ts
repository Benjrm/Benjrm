import type { Modifier } from "@dnd-kit/core"

/**
 * `@dnd-kit` drag modifier that clamps the dragged element's transform so it
 * cannot be moved outside its container's bounds.
 */
const restrictToParentElement: Modifier = ({ containerNodeRect, draggingNodeRect, transform }) => {
    if (!draggingNodeRect || !containerNodeRect) return transform

    return {
        ...transform,
        x: Math.min(
            Math.max(transform.x, containerNodeRect.left - draggingNodeRect.left),
            containerNodeRect.right - draggingNodeRect.right
        ),
        y: Math.min(
            Math.max(transform.y, containerNodeRect.top - draggingNodeRect.top),
            containerNodeRect.bottom - draggingNodeRect.bottom
        ),
    }
}
export default restrictToParentElement
