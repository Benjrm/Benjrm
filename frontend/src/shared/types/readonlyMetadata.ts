/** Server-assigned, read-only timestamps (ISO strings) shared by persisted entities. */
export interface ReadonlyMetadata {
    created: string
    modified: string
}
