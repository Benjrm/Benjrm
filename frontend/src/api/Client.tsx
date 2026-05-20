// frontend/src/api/client.tsx

const API_URL = import.meta.env.VITE_BACKEND_URL ?? ""

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }

    return (await res.json()) as T
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }

    return (await res.json()) as T
}

export async function apiDelete(path: string): Promise<void> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }

    return (await res.json()) as T
}
