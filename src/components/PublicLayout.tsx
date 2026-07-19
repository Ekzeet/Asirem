import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--border-soft)', background: '#fff' }}>
        <Link to="/" style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--navy-800)', fontSize: 18, textDecoration: 'none' }}>Asirem Academy</Link>
        <Link to="/courses" style={{ marginLeft: 8, color: '#5B6B82', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>{t('browseCourses')}</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} aria-label="Language"
            style={{ border: '1px solid var(--border-soft)', borderRadius: 8, padding: '6px 8px', fontWeight: 700, color: '#5B6B82' }}>
            <option value="fr">FR</option><option value="en">EN</option><option value="es">ES</option>
          </select>
          <Link to="/login" style={{ background: 'var(--navy-800)', color: '#fff', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>{t('login')}</Link>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ borderTop: '1px solid var(--border-soft)', padding: '20px 24px', display: 'flex', gap: 18, flexWrap: 'wrap', color: '#8494A8', fontSize: 13, fontWeight: 600, background: '#fff' }}>
        <span>© {new Date().getFullYear()} Asirem Academy</span>
        <Link to="/legal/terms" style={{ color: '#5B6B82', textDecoration: 'none' }}>{t('terms')}</Link>
        <Link to="/legal/privacy" style={{ color: '#5B6B82', textDecoration: 'none' }}>{t('privacy')}</Link>
        <Link to="/legal/refund" style={{ color: '#5B6B82', textDecoration: 'none' }}>{t('refund')}</Link>
      </footer>
    </div>
  )
}
