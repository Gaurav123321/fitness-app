import { getValidAccessToken } from '../auth/tokenService'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = await getValidAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await authHeaders()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  })

  if (!response.ok) {
    const text = await response.text()
    let message = text || `Request failed (${response.status})`
    try {
      const json = JSON.parse(text) as { message?: string }
      if (json.message) message = json.message
    } catch {
      /* use raw text */
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
