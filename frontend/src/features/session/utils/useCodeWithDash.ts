/**
 * Formats a numeric session code as an 8-digit, zero-padded string split by
 * a dash in the middle (e.g. `1234-5678`), for display as a game PIN.
 *
 * Despite the `use` prefix (kept for naming consistency with related hooks),
 * this is a pure formatting function with no React hook behavior.
 */
export default function useCodeWithDash(code?: number): string | undefined {
    if (code === undefined) return undefined
    const codeString = String(code).padStart(8, "0")
    const mid = Math.floor(codeString.length / 2)
    return `${codeString.slice(0, mid)}-${codeString.slice(mid)}`
}
