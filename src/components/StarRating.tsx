import { useState } from 'react'

const GOLD = '#E7B450'
const EMPTY = '#D8DEE8'

function Star({ fillPct, size, color }: { fillPct: number; size: number; color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, lineHeight: 0 }}>
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
        <path fill={EMPTY} d="M12 2.5l2.94 6.32 6.93.86-5.1 4.86 1.4 6.96L12 17.9l-6.17 3.6 1.4-6.96-5.1-4.86 6.93-.86z" />
      </svg>
      {fillPct > 0 && (
        <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${Math.min(100, Math.max(0, fillPct))}%` }}>
          <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
            <path fill={color} d="M12 2.5l2.94 6.32 6.93.86-5.1 4.86 1.4 6.96L12 17.9l-6.17 3.6 1.4-6.96-5.1-4.86 6.93-.86z" />
          </svg>
        </span>
      )}
    </span>
  )
}

/**
 * Read-only (no onChange): renders 5 stars filled up to `value`, supporting fractional
 * fill (e.g. 3.5) via a clipped overlay per star.
 * Interactive (onChange provided): renders 5 button stars; hover previews the selection,
 * click/keyboard commits an integer 1–5 rating.
 */
export function StarRating({ value, size = 18, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null)

  if (!onChange) {
    return (
      <span style={{ display: 'inline-flex', gap: 2 }} role="img" aria-label={`${value} / 5`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fillPct = Math.round(Math.min(1, Math.max(0, value - (i - 1))) * 100)
          return <Star key={i} fillPct={fillPct} size={size} color={GOLD} />
        })}
      </span>
    )
  }

  const active = hover ?? value
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          onClick={() => onChange(i)}
          aria-label={`${i} / 5`}
          style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', lineHeight: 0 }}
        >
          <Star fillPct={i <= active ? 100 : 0} size={size} color={GOLD} />
        </button>
      ))}
    </span>
  )
}

export default StarRating
