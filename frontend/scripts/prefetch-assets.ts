import type { Plugin } from "vite"

export default function prefetchAssets(): Plugin {
    return {
        name: "prefetch-assets",
        apply: "build",

        transformIndexHtml: {
            order: "post",
            handler(_, context) {
                const { bundle } = context

                if (!bundle) {
                    return []
                }

                return Object.values(bundle)
                    .filter((asset) => asset.fileName.startsWith("assets/"))
                    .map((asset) => {
                        const { fileName } = asset

                        let as: string
                        let rel: string

                        if (asset.type === "chunk" || fileName.endsWith(".js")) {
                            as = "script"
                            rel = "modulepreload"
                        } else if (fileName.endsWith(".css")) {
                            as = "style"
                            rel = "stylesheet"
                        } else if (/\.(woff2?|ttf|otf|eot)$/.test(fileName)) {
                            as = "font"
                            rel = "preload"
                        } else {
                            return null
                        }

                        return {
                            tag: "link",
                            attrs: {
                                rel,
                                href: `/${fileName}`,
                                as,
                                ...(as === "font" ? { crossorigin: "anonymous" } : {}),
                            },
                            injectTo: "head" as const,
                        }
                    })
                    .filter((tag) => tag !== null)
            },
        },
    }
}
