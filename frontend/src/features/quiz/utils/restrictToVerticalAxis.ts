import type { Modifier } from "@dnd-kit/core"

/** `@dnd-kit` drag modifier that zeroes out horizontal movement, constraining drags to a single vertical list. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
    ...transform,
    x: 0,
})
export default restrictToVerticalAxis
