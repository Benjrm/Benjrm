import type { Modifier } from "@dnd-kit/core"

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
})
export default restrictToVerticalAxis
