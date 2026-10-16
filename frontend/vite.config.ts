import { resolve } from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import localesPlugin from "./scripts/build-locales"
import prefetchAssets from "./scripts/prefetch-assets"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), localesPlugin(), prefetchAssets()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@shadcn": resolve(__dirname, "src/shadcn"),
        },
    },
    server: {
        allowedHosts: ["frontend"],
    },
})
