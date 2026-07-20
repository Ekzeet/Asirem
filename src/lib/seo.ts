import { useEffect } from 'react'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute('data-seo', '1')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
  return el
}

/**
 * Sets the document title + description/OG meta tags and injects a JSON-LD script for the
 * current page. Idempotent: nodes it creates are tagged data-seo="1" and reused across
 * re-renders; on unmount, nodes this hook created are removed and the previous title restored.
 */
export function useDocumentHead(opts: { title?: string; description?: string; jsonLd?: object }): void {
  const { title, description, jsonLd } = opts
  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const metaEls: HTMLMetaElement[] = []
    if (description) {
      metaEls.push(upsertMeta('name', 'description', description))
      metaEls.push(upsertMeta('property', 'og:description', description))
    }
    if (title) {
      metaEls.push(upsertMeta('property', 'og:title', title))
    }

    let scriptEl: HTMLScriptElement | null = null
    if (jsonLd) {
      scriptEl = document.head.querySelector<HTMLScriptElement>('script[data-seo="1"][type="application/ld+json"]')
      if (!scriptEl) {
        scriptEl = document.createElement('script')
        scriptEl.type = 'application/ld+json'
        scriptEl.setAttribute('data-seo', '1')
        document.head.appendChild(scriptEl)
      }
      scriptEl.textContent = JSON.stringify(jsonLd)
    }

    return () => {
      document.title = prevTitle
      metaEls.forEach((el) => el.parentNode?.removeChild(el))
      scriptEl?.parentNode?.removeChild(scriptEl)
    }
  }, [title, description, jsonLd])
}
