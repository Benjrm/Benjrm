import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import ThemeProvider from "./context/ThemeProvider"
import "./index.css"
import App from "./App.tsx"

const container = document.getElementById("root")
if (!container) throw new Error("Failed to find the root element")
const root = createRoot(container)

root.render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider defaultTheme="auto" storageKey="theme">
                <App />
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
)
