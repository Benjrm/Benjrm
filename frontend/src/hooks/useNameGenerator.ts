import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { toast } from "sonner"

interface GenerateNameResponse {
    name: string
}

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
    const [name, setName] = useState("")

    const generateNameMutation = useMutation({
        mutationFn: async (): Promise<GenerateNameResponse> => {
            // TODO: Replace API URI
            const response = await fetch("/api/generate-name")
            const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
            const responseBody = await response.text()

            if (!response.ok) {
                throw new Error(NAME_GENERATION_ERROR_MESSAGE)
            }

            if (!contentType.includes("application/json")) {
                throw new Error(NAME_GENERATION_ERROR_MESSAGE)
            }

            try {
                const data = JSON.parse(responseBody) as Partial<GenerateNameResponse>

                // Validate that the response has a non-empty string "name" property
                if (typeof data.name !== "string" || data.name.trim().length === 0) {
                    throw new Error(NAME_GENERATION_ERROR_MESSAGE)
                }

                return { name: data.name }
            } catch {
                throw new Error(NAME_GENERATION_ERROR_MESSAGE)
            }
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
