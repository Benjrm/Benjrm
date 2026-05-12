import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './context/ThemeProvider'
import { BrowserRouter } from "react-router"
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider defaultTheme="auto" storageKey="theme">
                <App />
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
)
