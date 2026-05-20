import { resolve } from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    envDir: "..",
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@shadcn": resolve(__dirname, "src/shadcn"),
        },
    },
})
