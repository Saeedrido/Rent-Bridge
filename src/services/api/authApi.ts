import { apiGet, apiPost } from './client'
import { AuthUser, BackendRole, getUser, normalizeRole, setTokens, setUser } from './tokens'

export interface RegisterPayload {
  email: string
  phone?: string
  firstName: string
  lastName: string
  role: BackendRole
  password: string
  barNumber?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken?: string
  refreshToken?: string
  access_token?: string
  refresh_token?: string
  user?: Partial<AuthUser>
  data?: {
    accessToken?: string
    refreshToken?: string
    user?: Partial<AuthUser>
  }
}

function extractTokens(data: Record<string, unknown>) {
  const nested = (data.data as Record<string, unknown> | undefined) ?? {}
  return {
    accessToken: (
      data.accessToken ??
      data.access_token ??
      data.token ??
      data.Token ??
      nested.accessToken ??
      nested.token ??
      nested.Token
    ) as string | undefined,
    refreshToken: (
      data.refreshToken ??
      data.refresh_token ??
      data.RefreshToken ??
      nested.refreshToken ??
      nested.RefreshToken
    ) as string | undefined,
  }
}

function roleFromJwt(token: string | undefined): string | undefined {
  if (!token) return undefined
  try {
    const payload = JSON.parse(atob(token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? ''))
    const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    return typeof role === 'string' ? role : undefined
  } catch {
    return undefined
  }
}

function mapUser(data: Record<string, unknown>): AuthUser {
  return {
    id: data.id as string | undefined,
    name: data.name as string | undefined,
    firstName: data.firstName as string | undefined,
    lastName: data.lastName as string | undefined,
    email: data.email as string | undefined,
    phone: data.phone as string | undefined,
    role: data.role ? normalizeRole(data.role as string) : undefined,
    barNumber: data.barNumber as string | undefined,
    verified: (data.identityVerified as boolean | undefined) ?? (data.verified as boolean | undefined),
  }
}

export interface UserProfile {
  id?: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  identityVerified?: boolean
  [key: string]: unknown
}

export async function getMe(): Promise<UserProfile> {
  return apiGet<UserProfile>('/auth/me')
}

/** Fetches the caller's profile and refreshes the stored auth user with it. */
export async function refreshProfile(): Promise<AuthUser | null> {
  try {
    const profile = await getMe()
    const user = mapUser(profile as unknown as Record<string, unknown>)
    const stored = getUser()
    const merged: AuthUser = {
      ...stored,
      ...user,
      name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || stored?.name,
      role: user.role ?? stored?.role ?? normalizeRole(profile.role),
      email: user.email ?? stored?.email,
      phone: user.phone ?? stored?.phone,
    }
    setUser(merged)
    return merged
  } catch {
    return null
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiPost<Record<string, unknown>>('/auth/register', payload)
  const { accessToken, refreshToken } = extractTokens(res)
  if (accessToken) setTokens(accessToken, refreshToken)
  const data = (res.data as Record<string, unknown> | undefined) ?? res
  const user = mapUser(data.user as Record<string, unknown> ?? data)
  setUser({ ...user, role: user.role ?? normalizeRole(payload.role) })
  return res as AuthResponse
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiPost<Record<string, unknown>>('/auth/login', payload)
  const { accessToken, refreshToken } = extractTokens(res)
  if (accessToken) setTokens(accessToken, refreshToken)
  const data = (res.data as Record<string, unknown> | undefined) ?? res
  const user = mapUser(data.user as Record<string, unknown> ?? data)
  const role = user.role ?? (roleFromJwt(accessToken) ? normalizeRole(roleFromJwt(accessToken)) : undefined)
  setUser({
    ...user,
    email: user.email ?? payload.email,
    role,
  })
  return res as AuthResponse
}

export async function logoutUser(): Promise<void> {
  const refreshToken = (() => {
    try {
      return localStorage.getItem('rb:refreshToken')
    } catch {
      return null
    }
  })()
  try {
    await apiPost<unknown>('/auth/logout', refreshToken ? { refreshToken } : undefined)
      .catch(() => undefined)
  } finally {
    clearStoredAuth()
  }
}

function clearStoredAuth() {
  try {
    localStorage.removeItem('rb:accessToken')
    localStorage.removeItem('rb:refreshToken')
    localStorage.removeItem('rb:user')
  } catch {
    /* noop */
  }
}