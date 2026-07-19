import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import PublicCatalog from './PublicCatalog'

export default function Home() {
  const { t } = useI18n()
  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg,#0F2C4C,#123f6b)', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 40, maxWidth: 760, margin: '0 auto 14px' }}>{t('heroTitle')}</h1>
        <p style={{ opacity: .85, fontSize: 17, maxWidth: 620, margin: '0 auto 24px' }}>{t('heroSub')}</p>
        <Link to="/courses" style={{ background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', padding: '12px 26px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('browseCourses')}</Link>
      </section>
      <PublicCatalog />
    </div>
  )
}
