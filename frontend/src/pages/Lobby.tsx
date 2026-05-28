import type { JSX } from "react"
import NameGenerator from "@/components/NameGenerator"

export default function Lobby(): JSX.Element {
    return (
        <div className="container mx-auto py-10">
            <h1 className="mb-6 text-3xl font-bold">Waiting Room</h1>
            <NameGenerator />
        </div>
    )
}
