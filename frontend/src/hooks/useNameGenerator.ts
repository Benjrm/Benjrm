import { useMutation } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { toast } from "sonner"
// Import the real API call for production use
import { getRandomNickname } from "@/api/nicknames"
// Import this to use the mock generator during development/testing
// import { getRandomNickname } from "@/api/nicknames.mock"

const NAME_GENERATION_ERROR_MESSAGE =
    "The name could not be generated at this time. Please try again."

interface UseNameGeneratorResult {
    name: string
    setName: Dispatch<SetStateAction<string>>
    isGenerating: boolean
    generateName: () => Promise<void>
}

/**
 * Manage the state and logic for generating a random name.
 * @returns An object containing the current name, a setter for the name, a boolean indicating if a name is being generated, and a function to trigger name generation.
 */
export default function useNameGenerator(): UseNameGeneratorResult {
    const [name, setName] = useState<string>(() => {
        // Initialize from sessionStorage if available
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("benjrm_nickname")
            if (saved) return saved
        }
        return ""
    })

    // Automatically save the name to sessionStorage whenever it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("benjrm_nickname", name)
        }
    }, [name])

    const generateNameMutation = useMutation({
        mutationFn: async () => {
            // To test with mock data, change the import above.
            const data = await getRandomNickname()

            if (!data || typeof data.name !== "string" || data.name.trim().length === 0) {
                throw new Error(NAME_GENERATION_ERROR_MESSAGE)
            }

            return data
        },
        onSuccess: (data) => {
            setName(data.name)
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : NAME_GENERATION_ERROR_MESSAGE, {
                richColors: true,
            })
        },
    })

    const generateName = async () => {
        await generateNameMutation.mutateAsync()
    }

    return {
        name,
        setName,
        isGenerating: generateNameMutation.isPending,
        generateName,
    }
}
