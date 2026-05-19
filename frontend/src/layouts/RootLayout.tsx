// frontend/layouts/RootLayout.tsx

import { Outlet } from "react-router"
import type { JSX } from "react"
import NavbarMain from "../components/NavbarMain"
import Footer from "../components/Footer"

export default function RootLayout(): JSX.Element {
    return (
        <div className="bg-background flex min-h-screen flex-col">
            <NavbarMain />

            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            <Footer />
        </div>
    )
}
