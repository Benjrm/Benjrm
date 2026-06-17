import { useEffect, useState } from "react"

export default function useCountdown(
    initialSeconds: number | null
): [number | null, (s: number | null) => void] {
    const [timeLeft, setTimeLeft] = useState<number | null>(initialSeconds)

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return undefined
        const id = setTimeout(() => setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0)), 1000)
        return () => clearTimeout(id)
    }, [timeLeft])

    return [timeLeft, setTimeLeft]
}
