import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import fg from "fast-glob"
import type { Plugin } from "vite"

const virtualModuleId = "virtual:locale"
const resolvedVirtualModuleId = `\0${virtualModuleId}`
const defaultLanguage = "en"

interface Locale {
    name: string
    path: string
    flag: string
}

export default function localesPlugin(): Plugin {
    let localeManifest: Record<string, Locale> = {}
    let fallback: Record<string, unknown> = {}
    let isBuild = false

    return {
        name: "hashed-locales",

        configResolved(config) {
            isBuild = config.command === "build"
        },

        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }
            return null
        },

        async buildStart() {
            const files = await fg("*.json", {
                cwd: "locales",
            })

            const locales = await Promise.all(
                files.map(async (file) => {
                    const raw = await fs.readFile(path.join("locales", file), "utf8")
                    const language = path.basename(file, ".json")
                    const translations = JSON.parse(raw)

                    return { file, raw, language, translations }
                })
            )

            localeManifest = {}
            fallback = {}

            await Promise.all(
                locales.map(async ({ file, raw, language, translations }) => {
                    if (language === defaultLanguage) {
                        fallback = translations
                    }

                    const hash = crypto
                        .createHash("sha256")
                        .update(raw)
                        .digest("base64url")
                        .slice(0, 8)

                    const filename = `${language}-${hash}.json`

                    // Emit hashed assets only during production builds.
                    if (isBuild && language !== defaultLanguage) {
                        this.emitFile({
                            type: "asset",
                            fileName: filename,
                            source: JSON.stringify(translations),
                        })
                    }

                    localeManifest[language] = {
                        name: translations.common.language.name,
                        path: isBuild ? `/${filename}` : `/${file}`,
                        flag: translations.common.language.flag,
                    }
                })
            )

            if (!files.some((file) => path.basename(file, ".json") === defaultLanguage)) {
                this.error(`Default locale "${defaultLanguage}" not found in locales/`)
            }
        },

        configureServer(server) {
            // Serve locale JSON files directly during development.
            server.middlewares.use("/", async (req, res, next) => {
                try {
                    const filename = (req.url ?? "").split("/")[1]
                    const filePath = path.resolve("locales", filename)
                    const content = await fs.readFile(filePath, "utf8")

                    res.setHeader("Content-Type", "application/json; charset=utf-8")
                    res.end(content)
                } catch {
                    next()
                }
            })
        },

        load(id) {
            if (id === resolvedVirtualModuleId) {
                return `
                    export const manifest = ${JSON.stringify(localeManifest)};
                    export const fallback = ${JSON.stringify(fallback)};
                `
            }
            return null
        },

        transformIndexHtml: {
            order: "post",

            handler() {
                if (!isBuild) {
                    return []
                }

                return Object.entries(localeManifest)
                    .filter(([language]) => language !== defaultLanguage)
                    .map(([, locale]) => ({
                        tag: "link",
                        attrs: {
                            rel: "prefetch",
                            href: locale.path,
                            as: "fetch",
                            crossorigin: "anonymous",
                        },
                        injectTo: "head" as const,
                    }))
            },
        },
    }
}
