/**
 * Base origin of the RentBridge API.
 *
 * Empty means "same origin", which is only correct for `vite dev`, where
 * server.proxy forwards /api/v1 to the backend. A production build is served by
 * a static host that has no such proxy, so a relative /api/v1 path resolves to
 * the static site, returns no JSON, and every request dies on
 * "Unexpected end of JSON input". Production therefore needs the absolute API
 * origin — set VITE_API_URL, or fall back to the deployed backend.
 */
const DEPLOYED_API_ORIGIN = 'https://rentbridge-5pwk.onrender.com'

const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

export const API_BASE_URL: string =
  configured || (import.meta.env.PROD ? DEPLOYED_API_ORIGIN : '')

export const API_PREFIX = '/api/v1'