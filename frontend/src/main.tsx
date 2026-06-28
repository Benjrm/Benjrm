import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import ThemeProvider from "./context/ThemeProvider"
import "./index.css"
import App from "./App.tsx"
import { WebSocketContext, websocketService } from "@/api/websocket"
import { ApiError } from "@/api/utils"
import "./i18n"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
                if (
                    error instanceof ApiError &&
                    (error.status === 401 || error.status === 403 || error.status === 404)
                ) {
                    return false
                }
                return failureCount < 3
            },
        },
    },
})

const container = document.getElementById("root")
if (!container) throw new Error("Failed to find the root element")
const root = createRoot(container)

root.render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <WebSocketContext value={websocketService}>
                <BrowserRouter>
                    <ThemeProvider defaultTheme="auto" storageKey="theme">
                        <Suspense fallback={<div>Loading...</div>}>
                            <App />
                        </Suspense>
                    </ThemeProvider>
                </BrowserRouter>
            </WebSocketContext>
        </QueryClientProvider>
    </StrictMode>
)
