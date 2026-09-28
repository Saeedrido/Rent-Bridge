import { ApiError } from './client'

function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Error) return true
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  if (typeof value === 'string') return value.length === 0
  return false
}

function resolve<T>(fallback: T | (() => T)): T {
  return typeof fallback === 'function' ? (fallback as () => T)() : fallback
}

export interface FallbackOptions<T> {
  fallback: T | (() => T)
  emptyWhen?: (value: T) => boolean
}

export async function withFallback<T>(
  load: () => Promise<T>,
  options: FallbackOptions<T>,
): Promise<T> {
  try {
    const value = await load()
    const emptyWhen = options.emptyWhen ?? (isMissing as (v: T) => boolean)
    if (emptyWhen(value)) return resolve(options.fallback)
    return value
  } catch {
    return resolve(options.fallback)
  }
}

export interface LoadResult<T> {
  data: T
  error: string | null
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status !== 0 && err.message) return err.message
  if (err instanceof Error && err.message) return err.message
  return ''
}

export async function loadWithFallback<T>(
  load: () => Promise<T>,
  fallback: T | (() => T),
  emptyWhen?: (value: T) => boolean,
): Promise<LoadResult<T>> {
  try {
    const value = await load()
    const check = emptyWhen ?? (isMissing as (v: T) => boolean)
    if (check(value)) return { data: resolve(fallback), error: null }
    return { data: value, error: null }
  } catch (err) {
    return { data: resolve(fallback), error: apiErrorMessage(err) || null }
  }
}