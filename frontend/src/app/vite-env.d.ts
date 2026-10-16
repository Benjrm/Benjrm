/* eslint-disable import-x/no-unused-modules */
declare module "virtual:locale" {
    interface LocaleInfo {
        name: string
        path: string
        flag: string
    }

    export const manifest: Record<string, LocaleInfo>
    export const fallback: Record<string, unknown>
}
