// frontend/layouts/RootLayout.tsx

import { Outlet } from "react-router"
import type { JSX } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function RootLayout(): JSX.Element {
    return (
        <>
            <div className="bg-background flex min-h-screen flex-col">
                <Navbar />

                <main className="relative mx-auto flex w-full flex-1 flex-col px-4 sm:px-6 lg:px-8">
                    <Outlet />
                </main>
            </div>
            <Footer />
        </>
    )
}
