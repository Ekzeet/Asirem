import { useState } from 'react'

const coverStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }

/**
 * Renders a marketing image from `public/images/marketing/`. Until the file exists
 * it falls back to a tasteful labelled placeholder — so the page never shows a broken
 * image icon. Drop your own file at `src` (see public/images/marketing/README.md).
 * The parent `.duotone` frame applies the brand-accent tint.
 */
export default function Photo({ src, alt, label, eager }: { src: string; alt: string; label: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 200, display: 'grid', placeItems: 'center', background: 'var(--color-accent-100)', color: 'var(--color-neutral-600)', fontSize: 13, textAlign: 'center', padding: 20 }}>
        {label}
      </div>
    )
  }
  return <img src={src} alt={alt} style={coverStyle} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
}
