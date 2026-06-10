// frontend/src/api/client.ts

import { ApiError } from "./utils"

export interface FetchOptions {
    method?: string
    body?: unknown
    headers?: HeadersInit
    signal?: AbortSignal
}

function createFriendlyApiError(status = 500): ApiError {
    const message = `The backend is currently unavailable. Please try again later.`
    return new ApiError(status, message)
}

export async function fetcher<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    const { method = "GET", body, headers, signal } = opts
    const url = `/api/v1${path}`

    const headerMap: Record<string, string> = {
        ...(headers as Record<string, string> | undefined),
    }

    const init: RequestInit = { method, signal }

    if (body !== undefined) {
        if (body instanceof FormData) {
            init.body = body as BodyInit
        } else {
            headerMap["Content-Type"] = "application/json"
            init.body = JSON.stringify(body)
        }
    }

    if (Object.keys(headerMap).length) init.headers = headerMap

    const res = await fetch(url, init)

    if (!res.ok) {
        let error
        try {
            error = new ApiError(res.status, await res.json())
        } catch {
            throw createFriendlyApiError(res.status)
        }
        throw error
    }

    if (res.status === 204) return undefined as T

    const responseText = await res.text()
    if (!responseText) return undefined as T

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
        throw createFriendlyApiError(res.status)
    }

    try {
        return JSON.parse(responseText) as T
    } catch {
        throw createFriendlyApiError(res.status)
    }
}

// Backwards-compatible helpers used across the codebase
export async function apiGet<T>(path: string): Promise<T> {
    return fetcher<T>(path, { method: "GET" })
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    return fetcher<T>(path, { method: "POST", body })
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
    return fetcher<T>(path, { method: "PATCH", body })
}

export async function apiDelete(path: string): Promise<void> {
    await fetcher<undefined>(path, { method: "DELETE" })
}
