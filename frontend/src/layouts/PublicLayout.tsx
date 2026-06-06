// frontend/src/layouts/PublicLayout.tsx

import type { JSX } from "react"
import { Outlet } from "react-router"
import Footer from "../components/Footer"
import Navbar from "@/components/Navbar"

export default function PublicLayout(): JSX.Element {
    return (
        <>
            <div className="bg-background flex min-h-screen flex-col">
                <Navbar />

                <main className="relative mx-auto flex w-full flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
                    <Outlet />
                </main>
            </div>
            <Footer />
        </>
    )
}
