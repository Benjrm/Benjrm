/**
 * Utility function used to ensure exhaustive checks in switch statements.
 *
 * This function should never be called at runtime. It is used to enforce
 * compile-time exhaustiveness checking in TypeScript when handling union types.
 *
 * @param value - A value that should be of type `never` if all cases are handled correctly.
 * @throws Always throws an error if executed at runtime.
 */
export default function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}
