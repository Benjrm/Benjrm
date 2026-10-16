import { resolve } from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import localesPlugin from "./scripts/build-locales.ts"
import prefetchAssets from "./scripts/prefetch-assets.ts"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), localesPlugin(), prefetchAssets()],
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "src"),
            "@shadcn": resolve(import.meta.dirname, "src/shadcn"),
        },
    },
    server: {
        allowedHosts: ["frontend"],
    },
})
