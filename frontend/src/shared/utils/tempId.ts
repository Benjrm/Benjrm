export default function tempId(): string {
    return `temp-${crypto.randomUUID()}`
}
