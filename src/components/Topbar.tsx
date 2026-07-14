import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import type { Lang } from '../i18n/dict'
import { Icon } from './Icon'
import { initials } from '../lib/format'
import NotificationBell from './NotificationBell'

function usePageMeta(): { title: string; sub: string } {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()
  const sub = (fr: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : fr)
  if (pathname.startsWith('/admin/courses')) return { title: t('courses'), sub: sub('Crée, publie et tarife tes cours', 'Create, publish and price your courses', 'Crea, publica y fija precios') }
  if (pathname.startsWith('/admin/students')) return { title: t('students'), sub: sub('Inscriptions et progression', 'Enrollments and progress', 'Inscripciones y progreso') }
  if (pathname.startsWith('/admin/teachers')) return { title: t('teachers'), sub: sub('Formateurs et permissions', 'Instructors and permissions', 'Formadores y permisos') }
  if (pathname.startsWith('/admin/sales')) return { title: t('sales'), sub: sub('Revenus, formules et coupons', 'Revenue, plans and coupons', 'Ingresos, planes y cupones') }
  if (pathname.startsWith('/admin')) return { title: t('dashboard'), sub: sub('Vue d’ensemble de ton académie', 'Overview of your academy', 'Resumen de tu academia') }
  if (pathname.startsWith('/teacher')) return { title: t('dashboard'), sub: sub('Ton activité de formateur', 'Your teaching at a glance', 'Tu enseñanza') }
  if (pathname.startsWith('/student/course')) return { title: sub('Lecture en cours', 'Now playing', 'Reproduciendo'), sub: 'Asirem Academy' }
  if (pathname.startsWith('/student/certificates')) return { title: t('certificates'), sub: sub('Tes attestations obtenues', 'Your earned credentials', 'Tus credenciales') }
  if (pathname.startsWith('/student')) return { title: t('myCourses'), sub: sub('Ta progression', 'Your learning journey', 'Tu ruta de aprendizaje') }
  if (pathname.startsWith('/community')) return { title: t('community'), sub: sub('Discussions, groupes et événements', 'Discussions, groups and events', 'Debates, grupos y eventos') }
  return { title: t('dashboard'), sub: '' }
}

export default function Topbar() {
  const { t, lang, setLang, roleName } = useI18n()
  const { me } = useAuth()
  const { title, sub } = usePageMeta()
  if (!me) return null

  return (
    <header style={{ height: 66, flex: 'none', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px' }}>
      <div style={{ width: 250, flex: 'none' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--navy-800)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 12, color: '#9AA7B8' }} />
        <input placeholder={t('search')} style={{ width: 230, height: 40, border: '1px solid #E2E8F0', borderRadius: 11, background: '#F7F9FC', padding: '0 14px 0 36px', fontSize: 13.5, color: 'var(--navy-800)', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: 4, background: '#F2F5F9', borderRadius: 10, padding: 3 }}>
        {(['FR', 'EN', 'ES'] as const).map((c) => {
          const active = lang === (c.toLowerCase() as Lang)
          return (
            <button key={c} onClick={() => setLang(c.toLowerCase() as Lang)} style={{ width: 34, height: 30, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 11.5, background: active ? 'var(--navy-800)' : 'transparent', color: active ? '#fff' : 'var(--muted)' }}>{c}</button>
          )
        })}
      </div>
      <NotificationBell />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6, borderLeft: '1px solid var(--border)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14 }}>{initials(me.fullName)}</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-800)' }}>{me.fullName}</div>
          <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600 }}>{roleName(me.role)}</div>
        </div>
      </div>
    </header>
  )
}
