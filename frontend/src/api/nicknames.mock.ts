import type { GenerateNameResponse } from "./nicknames"

export const MOCK_NAMES = [
    "Captain Awesome",
    "Ninja Coder",
    "Sleepy Panda",
    "Quantum Hacker",
    "Digital Nomad",
    "Pixel Ranger",
    "Cyber Sorcerer",
    "Electric Dreamer",
]

/**
 * Mocks the API call to get a random nickname.
 * Useful for testing.
 */
export async function getRandomNickname(): Promise<GenerateNameResponse> {
    // Simulate network delay
    await new Promise((resolve) => {
        setTimeout(resolve, 500)
    })

    // Pick a random name from the mock data
    const randomIndex = Math.floor(Math.random() * MOCK_NAMES.length)
    return { name: MOCK_NAMES[randomIndex] }
}
