/**
 * Generates a client-side placeholder id for entities that don't have a
 * server-assigned id yet (e.g. a question or answer option created locally
 * before being persisted).
 *
 * The `temp-` prefix lets callers distinguish these from real (server) ids.
 */
export default function tempId(): string {
    return `temp-${crypto.randomUUID()}`
}
