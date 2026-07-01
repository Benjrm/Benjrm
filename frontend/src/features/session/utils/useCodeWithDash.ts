export default function useCodeWithDash(code?: number): string | undefined {
    if (code === undefined) return undefined
    const codeString = String(code).padStart(8, "0")
    const mid = Math.floor(codeString.length / 2)
    return `${codeString.slice(0, mid)}-${codeString.slice(mid)}`
}
