import { API_BASE_URL, API_PREFIX } from './config'
import { refreshAccessToken, ApiError, errorFromBody } from './client'
import { getAccessToken } from './tokens'

/**
 * Uploads a file (photo or ownership document) to the backend, which hosts
 * it in object storage (Cloudinary) and returns the HTTPS URL to attach to
 * a property/listing.
 */
export async function uploadFile(file: File): Promise<string> {
  const url = `${API_BASE_URL}${API_PREFIX}/uploads`
  const form = new FormData()
  form.append('file', file)

  const token = getAccessToken()
  console.log('[UPLOAD DEBUG] Uploading file:', file.name, 'type:', file.type, 'size:', file.size)
  let response = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newToken}` },
        body: form,
      })
    }
  }

  if (!response.ok) {
    let fallback = `Upload failed (${response.status})`
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      /* noop */
    }
    throw new ApiError(errorFromBody(body, fallback), response.status)
  }

  const data = (await response.json()) as Record<string, unknown>
  console.log('[UPLOAD DEBUG] Upload response:', data)
  const hosted = (data.url ?? data.secure_url) as string | undefined
  console.log('[UPLOAD DEBUG] Hosted URL:', hosted)
  if (!hosted) throw new ApiError('Upload returned no URL.')
  return hosted
}