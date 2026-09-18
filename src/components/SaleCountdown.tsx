import { useEffect, useState } from 'react'

/** Live countdown to a sale's end. Shows d/h/m while far out, then h/m/s in the final day. Renders nothing once elapsed. */
export function SaleCountdown({ endsAt, style }: { endsAt: string; style?: React.CSSProperties }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ms = Date.parse(endsAt) - now
  if (!Number.isFinite(ms) || ms <= 0) return null
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts = d > 0 ? [`${d}d`, `${h}h`, `${m}m`] : [`${h}h`, `${m}m`, `${s}s`]
  return <span style={style}>{parts.join(' ')}</span>
}
