import { useContext } from "react"
import { GameSessionContext } from "@/context/GameSessionContext"
import type { GameSessionContextType } from "@/context/GameSessionContext"

export default function useGameSession(): GameSessionContextType {
    const context = useContext(GameSessionContext)
    if (!context) {
        throw new Error("useGameSession must be used within a GameSessionProvider")
    }
    return context
}
