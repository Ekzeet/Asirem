import { useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export default function Legal() {
  const { doc } = useParams()
  const { t } = useI18n()
  const key = doc === 'privacy' ? 'privacyBody' : doc === 'refund' ? 'refundBody' : 'termsBody'
  const title = doc === 'privacy' ? t('privacy') : doc === 'refund' ? t('refund') : t('terms')
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, marginBottom: 12 }}>{title}</h1>
      <div style={{ whiteSpace: 'pre-wrap', color: '#334', lineHeight: 1.6, fontSize: 15 }}>{t(key)}</div>
    </div>
  )
}
