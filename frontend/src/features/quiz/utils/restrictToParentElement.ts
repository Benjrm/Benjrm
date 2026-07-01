import type { Modifier } from "@dnd-kit/core"

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
