import { API_BASE_URL, API_PREFIX } from './config'
import { getAccessToken, getRefreshToken, setTokens, clearAuth } from './tokens'

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function errorFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const error = record.error
    if (typeof error === 'string' && error.trim()) return error
    const detail = record.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    const title = record.title
    if (typeof title === 'string' && title.trim()) return title
    const message = record.message
    if (typeof message === 'string' && message.trim()) return message
    const errors = record.errors
    if (errors && typeof errors === 'object') {
      const first = Object.values(errors)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
      if (typeof first === 'string') return first
    }
  }
  return fallback
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  showLoading?: boolean
  loadingMessage?: string
}

let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    // Handle multiple possible response formats (camelCase, PascalCase, nested)
    const access = (
      data.accessToken ??
      data.access_token ??
      data.token ??
      data.Token ??
      (data.data as Record<string, unknown> | undefined)?.accessToken ??
      (data.data as Record<string, unknown> | undefined)?.token ??
      (data.data as Record<string, unknown> | undefined)?.Token
    ) as string | undefined
    const newRefresh = (
      data.refreshToken ??
      data.refresh_token ??
      data.RefreshToken ??
      (data.data as Record<string, unknown> | undefined)?.refreshToken ??
      (data.data as Record<string, unknown> | undefined)?.RefreshToken
    ) as string | undefined
    if (access) {
      setTokens(access, newRefresh ?? refreshToken)
      return access
    }
    return null
  } catch {
    return null
  }
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { showLoading = true, loadingMessage, ...fetchOptions } = options

  const token = getAccessToken()
  const headers = new Headers(fetchOptions.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const url = `${API_BASE_URL}${path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path}`}`

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: fetchOptions.body !== undefined ? JSON.stringify(fetchOptions.body) : undefined,
  })

  if (response.status === 401 && !path.includes('/auth/refresh')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null
      })
    }
    const newToken = await refreshPromise
    if (newToken) {
      const headers = new Headers(fetchOptions.headers)
      headers.set('Content-Type', 'application/json')
      headers.set('Authorization', `Bearer ${newToken}`)
      const response2 = await fetch(url, {
        ...fetchOptions,
        headers,
        body: fetchOptions.body !== undefined ? JSON.stringify(fetchOptions.body) : undefined,
      })
      if (!response2.ok) {
        let fallback = `Request failed (${response2.status})`
        let body: unknown = null
        try {
          body = await response2.json()
        } catch {
          /* noop */
        }
        if (response2.status === 401) clearAuth()
        throw new ApiError(errorFromBody(body, fallback), response2.status)
      }
      return (await response2.json()) as T
    }

  }

  if (!response.ok) {
    const fallback = `Request failed (${response.status})`
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      /* noop */
    }
    if (response.status === 401) clearAuth()
    throw new ApiError(errorFromBody(body, fallback), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }
  if (response.headers.get('content-type')?.includes('application/pdf')) {
    return (await response.blob()) as unknown as T
  }

  return (await response.json()) as T
}

export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return rawRequest<T>(path, { ...options, method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  return rawRequest<T>(path, { ...options, method: 'POST', body })
}

export function apiPut<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  return rawRequest<T>(path, { ...options, method: 'PUT', body })
}

export function apiPatch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  return rawRequest<T>(path, { ...options, method: 'PATCH', body })
}

export function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return rawRequest<T>(path, { ...options, method: 'DELETE' })
}