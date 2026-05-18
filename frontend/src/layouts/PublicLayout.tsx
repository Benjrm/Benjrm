// frontend/src/layouts/PublicLayout.tsx

import type { JSX } from "react"
import { Outlet } from "react-router"
import Footer from "../components/Footer"
import Navbar from "@/components/Navbar"

export default function PublicLayout(): JSX.Element {
    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Navbar />

            <main className="flex flex-1 flex-col py-8">
                <Outlet />
            </main>

            <Footer />
        </div>
    )
}
