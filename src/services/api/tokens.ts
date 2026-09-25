export interface AuthUser {
  id?: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  barNumber?: string
  verified?: boolean
}

const ACCESS_KEY = 'rb:accessToken'
const REFRESH_KEY = 'rb:refreshToken'
const USER_KEY = 'rb:user'

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value) sessionStorage.setItem(key, value)
    else sessionStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY)
}

export function setAccessToken(token: string | null) {
  write(ACCESS_KEY, token)
}

export function setRefreshToken(token: string | null) {
  write(REFRESH_KEY, token)
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  setAccessToken(accessToken)
  if (refreshToken) setRefreshToken(refreshToken)
}

export function getUser(): AuthUser | null {
  const raw = read(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setUser(user: AuthUser | null) {
  write(USER_KEY, user ? JSON.stringify(user) : null)
}

export function clearAuth() {
  setAccessToken(null)
  setRefreshToken(null)
  setUser(null)
}

export type BackendRole = 'Landlord' | 'Tenant' | 'Caretaker' | 'Agent' | 'Lawyer' | 'Admin'

export function normalizeRole(role?: string): string {
  const lower = (role ?? '').trim().toLowerCase()
  switch (lower) {
    case 'landlord':
      return 'landlord'
    case 'tenant':
      return 'tenant'
    case 'caretaker':
    case 'agent':
      return 'caretaker'
    case 'lawyer':
      return 'lawyer'
    case 'admin':
      return 'admin'
    default:
      return lower
  }
}