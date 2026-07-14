import { useI18n } from '../i18n/I18nContext'
import { avatarGradient, initials } from '../lib/format'
import { Icon } from './Icon'

export function PageWrap({ children, maxWidth = 1280 }: { children: React.ReactNode; maxWidth?: number }) {
  return <div className="lmsfade" style={{ padding: '26px 30px 46px', maxWidth }}>{children}</div>
}

export function Avatar({ name, size = 38, radius = 10, gradient }: { name: string; size?: number; radius?: number; gradient?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flex: 'none', background: gradient ?? avatarGradient(name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: size * 0.34 }}>
      {initials(name)}
    </div>
  )
}

export function ProgressBar({ pct, height = 7, from = '#D9A441', to = '#E7B450' }: { pct: number; height?: number; from?: string; to?: string }) {
  return (
    <div style={{ height, background: '#EEF2F7', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg,${from},${to})`, width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}

export function StatusChip({ status }: { status: string }) {
  const { lang } = useI18n()
  const published = status === 'published' || status === 'active'
  const label = published
    ? (lang === 'en' ? (status === 'active' ? 'Active' : 'Published') : lang === 'es' ? (status === 'active' ? 'Activo' : 'Publicado') : status === 'active' ? 'Actif' : 'Publié')
    : (lang === 'en' ? (status === 'invited' ? 'Pending' : 'Draft') : lang === 'es' ? (status === 'invited' ? 'Pendiente' : 'Borrador') : status === 'invited' ? 'En attente' : 'Brouillon')
  const [bg, fg] = published ? ['#EAF6EF', '#1F8A5B'] : status === 'invited' ? ['#FBF3E1', '#C99A2E'] : ['#EEF2F7', '#7C8AA0']
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: bg, color: fg }}>{label}</span>
}

export function CourseCover({ accent, icon, height = 104, children }: { accent?: string | null; icon?: string | null; height?: number; children?: React.ReactNode }) {
  return (
    <div style={{ height, background: accent ?? 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
      {icon && <Icon name={icon} size={24} style={{ position: 'absolute', top: 14, right: 14, color: 'rgba(255,255,255,.85)' }} />}
      {children}
    </div>
  )
}

export function Loader() {
  const { t } = useI18n()
  return (
    <div className="center-fill" style={{ minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spin" style={{ margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{t('loading')}</div>
      </div>
    </div>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="card" style={style}>{children}</div>
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sub ? 6 : 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}
