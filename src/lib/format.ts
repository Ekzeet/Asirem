/** Formatting + small presentation helpers shared across pages. */

export function money(cents: number | null | undefined): string {
  const v = (cents ?? 0) / 100
  if (Math.abs(v) >= 1000) return '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function moneyFull(cents: number | null | undefined): string {
  return '$' + ((cents ?? 0) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

/** Deterministic gradient for an avatar, seeded by a string (name/id). */
const AVATARS = [
  'linear-gradient(135deg,#0F2C4C,#1B4B7F)',
  'linear-gradient(135deg,#7C5CD6,#9B7BE8)',
  'linear-gradient(135deg,#1F8A5B,#35A874)',
  'linear-gradient(135deg,#C99A2E,#E7B450)',
  'linear-gradient(135deg,#D14343,#E86A6A)',
  'linear-gradient(135deg,#1B5FB0,#2E7DD1)',
]
export function avatarGradient(seed: string | null | undefined): string {
  let h = 0
  const s = seed ?? ''
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff
  return AVATARS[h % AVATARS.length]
}

export function relTime(iso: string, lang: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const min = Math.round(diff / 60000)
  const map: Record<string, [string, string, string, string]> = {
    fr: ['min', 'h', 'j', 'à l’instant'],
    en: ['min', 'h', 'd', 'just now'],
    es: ['min', 'h', 'd', 'ahora'],
  }
  const [m, h, dd, now] = map[lang] ?? map.en
  if (min < 1) return now
  if (min < 60) return `${min} ${m}`
  const hrs = Math.round(min / 60)
  if (hrs < 24) return `${hrs} ${h}`
  return `${Math.round(hrs / 24)} ${dd}`
}
