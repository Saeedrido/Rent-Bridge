import { apiGet } from '../services/api/client'

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url).pathname
    const last = path.split('/').filter(Boolean).pop()
    if (last && last.includes('.')) return last
  } catch {
    // ignore bad URLs
  }
  return fallback
}

/**
 * Downloads a cross-origin (Cloudinary) ownership document by fetching it as
 * a blob and triggering a browser download.
 *
 * The raw URL alone cannot be fetched: Cloudinary gates raw/PDF delivery (and
 * private assets) behind a signed `/s--SIGNATURE--/` delivery component that
 * is derived from the API secret, so a plain request fails with 401
 * "deny or ACL failure". We therefore ask the API for a signed URL first.
 * `?download=1` on the raw URL does nothing and the `download` attribute is
 * ignored across origins, which is why the previous version opened a new tab.
 */
export async function downloadDocumentFile(
  fileKey: string,
  fileName: string
): Promise<void> {
  const { url: signedUrl } = await apiGet<{ url: string }>(
    `/uploads/signed-url?fileUrl=${encodeURIComponent(fileKey)}`
  )

  const response = await fetch(signedUrl)
  if (!response.ok) {
    throw new Error(`Download failed (HTTP ${response.status}).`)
  }

  const blob = await response.blob()
  const name = fileName.includes('.')
    ? fileName
    : fileNameFromUrl(fileKey, fileName)

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}