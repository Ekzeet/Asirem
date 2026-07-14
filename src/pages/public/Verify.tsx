import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Icon } from '../../components/Icon'

type VerifyResult = { valid: boolean; serial?: string; full_name?: string; course_title?: string; institution?: string; issued_at?: string }

export default function Verify() {
  const { serial } = useParams()
  const { t, lang } = useI18n()

  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('verify_certificate', { p_serial: serial! })
    return data as unknown as VerifyResult
  }, [serial])

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const valid = data?.valid

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F2C4C,#0B2038)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
        <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#E7B450,#D9A441)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2C4C', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20 }}>A</div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)' }}>Asirem Academy</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{t('verifyTitle')}</div>
          </div>
        </div>

        <div style={{ padding: '30px 26px', textAlign: 'center' }}>
          {loading ? (
            <div className="spin" style={{ margin: '20px auto' }} />
          ) : valid ? (
            <>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name="badge-check" size={32} color="#1F8A5B" /></div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: '#1F8A5B', marginBottom: 18 }}>{t('verifyValid')}</div>
              <div style={{ textAlign: 'left', background: '#F7F9FC', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                <Row label={t('verifyIssuedTo')} value={data!.full_name ?? ''} />
                <Row label={t('course')} value={data!.course_title ?? ''} />
                <Row label={t('issuedTo').includes('Délivré') ? 'Date' : 'Date'} value={fmt(data!.issued_at)} />
                <Row label="ID" value={data!.serial ?? ''} mono />
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name="x-circle" size={32} color="#D14343" /></div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: '#D14343', marginBottom: 6 }}>{t('verifyInvalid')}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{serial}</div>
            </>
          )}
          <a href="/" style={{ display: 'inline-block', marginTop: 22, fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{t('verifyBackHome')} →</a>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid #EEF2F7' }}>
      <span style={{ fontSize: 12, color: '#8494A8', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: 'var(--navy-800)', fontWeight: 700, fontFamily: mono ? 'var(--display)' : 'var(--sans)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
