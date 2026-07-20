import { useSearchParams, Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export default function CheckoutReturn() {
  const [sp] = useSearchParams()
  const { t } = useI18n()
  const ok = sp.get('status') === 'success'
  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 44 }}>{ok ? '✅' : '↩️'}</div>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)' }}>{ok ? t('purchaseThanks') : t('purchaseCancelled')}</h1>
      <p style={{ color: '#5B6B82', fontWeight: 600 }}>{ok ? t('purchaseThanksSub') : t('purchaseCancelledSub')}</p>
      <Link to="/login" style={{ display: 'inline-block', marginTop: 14, background: 'var(--navy-800)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('login')}</Link>
    </div>
  )
}
