/**
 * Utility to enforce exhaustive type checking in discriminated unions.
 *
 * This function is used in `switch` statements to ensure that all possible
 * cases of a union type are handled. If a new variant is added but not
 * handled, TypeScript will raise a compile-time error when the value is
 * passed to this function.
 *
 * At runtime, calling this function always throws, because reaching it
 * indicates an unexpected or unhandled case.
 *
 * @param x - A value of type `never`, meaning it should be impossible to reach.
 * @throws Always throws an error indicating an unsupported case.
 */
export default function assertNever(x: never): never {
    throw new Error(`Unsupported value: ${JSON.stringify(x)}`)
}
