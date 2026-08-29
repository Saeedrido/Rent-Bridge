import { useEffect } from 'react'

interface SeoProps {
  title: string
  description: string
  path?: string
  image?: string
  type?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function setMeta(key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${key}"], meta[property="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    const isOg = key.startsWith('og:')
    el.setAttribute(isOg ? 'property' : 'name', key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export function Seo({ title, description, path = '', image, type = 'website', jsonLd }: SeoProps) {
  const url = `${window.location.origin}${path}`

  useEffect(() => {
    document.title = title
    setMeta('description', description)
    setMeta('og:title', title)
    setMeta('og:description', description)
    setMeta('og:type', type)
    setMeta('og:url', url)
    setCanonical(url)
    if (image) setMeta('og:image', image)
  }, [title, description, url, type, image])

  useEffect(() => {
    if (!jsonLd) return
    const scriptId = 'seo-jsonld'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLd)
    return () => {
      document.getElementById(scriptId)?.remove()
    }
  }, [jsonLd])

  return null
}
