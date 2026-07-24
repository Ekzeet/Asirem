import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../auth/demoAccounts'
import { supabase } from '../lib/supabase'
import { Icon } from './Icon'

type NavItem = { to: string; key: string; icon: string; badge?: string }

const NAV: Record<string, NavItem[]> = {
  institution_admin: [
    { to: '/admin', key: 'dashboard', icon: 'layout-dashboard' },
    { to: '/admin/courses', key: 'courses', icon: 'book-open' },
    { to: '/admin/students', key: 'students', icon: 'graduation-cap' },
    { to: '/admin/teachers', key: 'teachers', icon: 'users' },
    { to: '/review', key: 'review', icon: 'clipboard-check' },
    { to: '/admin/sales', key: 'sales', icon: 'credit-card' },
    { to: '/admin/audit', key: 'audit', icon: 'shield' },
    { to: '/admin/analytics', key: 'analytics', icon: 'trending-up' },
    { to: '/admin/blog', key: 'blog', icon: 'file-text' },
    { to: '/community', key: 'community', icon: 'messages-square', badge: '12' },
  ],
  teacher: [
    { to: '/teacher', key: 'dashboard', icon: 'layout-dashboard' },
    { to: '/admin/courses', key: 'courses', icon: 'book-open' },
    { to: '/admin/students', key: 'students', icon: 'graduation-cap' },
    { to: '/review', key: 'review', icon: 'clipboard-check' },
    { to: '/exams', key: 'exams', icon: 'file-check' },
    { to: '/community', key: 'community', icon: 'messages-square' },
  ],
  student: [
    { to: '/student', key: 'myCourses', icon: 'book-open' },
    { to: '/student/catalog', key: 'catalog', icon: 'compass' },
    { to: '/exams', key: 'exams', icon: 'file-check' },
    { to: '/community', key: 'community', icon: 'messages-square', badge: '3' },
    { to: '/student/certificates', key: 'certificates', icon: 'award' },
  ],
}

export default function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { me, signOut } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const loc = useLocation()
  if (!me) return null
  const items = NAV[me.role] ?? NAV.student

  const isActive = (to: string) => (to === '/admin' || to === '/teacher' || to === '/student' ? loc.pathname === to : loc.pathname.startsWith(to))

  async function switchTo(email: string) {
    await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
  }

  return (
    <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`} style={{ width: 252, flex: 'none', background: 'linear-gradient(180deg,#0F2C4C 0%,#0B2038 100%)', display: 'flex', flexDirection: 'column', color: '#DCE4EE' }}>
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#E7B450,#D9A441)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2C4C', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 19, boxShadow: '0 4px 14px rgba(217,164,65,.35)' }}>A</div>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: .2 }}>Asirem</div>
          <div style={{ fontSize: 10.5, color: '#8FA3BC', fontWeight: 600, letterSpacing: .4, textTransform: 'uppercase' }}>Academy · LMS</div>
        </div>
      </div>

      <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: .8, color: '#6E84A0', textTransform: 'uppercase' }}>{t('menu')}</div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '2px 12px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map((it) => {
          const active = isActive(it.to)
          return (
            <button key={it.to} onClick={() => { nav(it.to); onClose?.() }} style={{
              display: 'flex', alignItems: 'center', gap: 12, height: 42, borderRadius: 11, border: 'none', cursor: 'pointer',
              fontWeight: active ? 700 : 600, fontSize: 13.5, transition: 'all .16s',
              background: active ? 'rgba(217,164,65,.16)' : 'transparent', color: active ? '#F0C978' : '#B6C4D6',
              borderLeft: `3px solid ${active ? '#D9A441' : 'transparent'}`, paddingLeft: active ? 10 : 13, paddingRight: 13,
            }}>
              <Icon name={it.icon} size={18} />
              <span style={{ flex: 1, textAlign: 'left' }}>{t(it.key)}</span>
              {it.badge && (
                <span style={{ fontSize: 10.5, fontWeight: 800, background: '#D9A441', color: '#0F2C4C', minWidth: 20, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{it.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: .8, color: '#6E84A0', textTransform: 'uppercase', marginBottom: 9 }}>{t('viewAs')}</div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,.05)', padding: 4, borderRadius: 11 }}>
          {DEMO_ACCOUNTS.map((a) => {
            const active = me.role === a.role
            const short = a.role === 'institution_admin' ? 'Admin' : a.role === 'teacher' ? 'Prof' : 'Élève'
            return (
              <button key={a.email} title={a.name} onClick={() => switchTo(a.email)} style={{
                flex: 1, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12,
                background: active ? '#D9A441' : 'transparent', color: active ? '#0F2C4C' : '#9DB0C7',
              }}>{short}</button>
            )
          })}
        </div>
        <button onClick={() => signOut()} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 36, borderRadius: 9, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: '#8FA3BC', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
          <Icon name="log-out" size={15} /> {t('signOut')}
        </button>
      </div>
    </aside>
  )
}
